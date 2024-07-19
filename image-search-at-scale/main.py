from io import BytesIO
import concurrent.futures
import hashlib
import os
import shutil
import time

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import CLIPProcessor, CLIPModel
from PIL import Image

import torch
import requests
from dotenv import load_dotenv
from pinecone import Pinecone
from pydantic import BaseModel

app = FastAPI()

origins = ["http://localhost:3000", "localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
IMAGE_PATH = "./search-app/src/assets/image.jpeg"
MODEL = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
PROCESSOR = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

CACHED_IMAGE_HASH = None
CACHED_EMBEDDING = None


def get_image_hash(image_path):
    with open(image_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def get_image_embedding():
    global CACHED_IMAGE_HASH
    global CACHED_EMBEDDING
    start_time = time.time()

    # Get the hash of the new image
    new_image_hash = get_image_hash(IMAGE_PATH)

    # If the hash of the new image is the same as the hash of the cached image,
    # the image has not changed
    if new_image_hash == CACHED_IMAGE_HASH:
        print("Image has not changed. Using cached image embedding.")
        return CACHED_EMBEDDING

    CACHED_IMAGE_HASH = new_image_hash
    print("Computing the image embedding")
    image = Image.open(IMAGE_PATH)

    # Preprocess the image and return PyTorch tensor
    inputs = PROCESSOR(images=image, return_tensors="pt")
    # Generate the image embedding
    with torch.no_grad():
        image_embeddings = MODEL.get_image_features(**inputs)

    # Convert the image embedding from a numpy array to a list
    CACHED_EMBEDDING = image_embeddings.cpu().numpy().tolist()

    end_time = time.time()
    print(f"Get image embedding execution time: {(end_time - start_time) * 1000} ms")
    return CACHED_EMBEDDING


def pinecone_query(embedding, index):
    top_k = 15
    metadata_filter = {"dead-link": {"$ne": True}}

    query_start_time = time.time()
    result = index.query(
        vector=embedding, top_k=top_k, include_metadata=True, filter=metadata_filter
    )
    query_response_time = calculate_duration(query_start_time)
    print(f"Pinecone query execution time: {query_response_time} ms")

    query_results = []
    for m in result.matches:
        query_results.append(
            {
                "id": m["id"],
                "url": m["metadata"]["url"],
                "dead-link": False,
                "score": m["score"],
                "caption": m["metadata"]["caption"],
            }
        )
    return query_results


def validate_results(query_results):
    validation_start_time = time.time()
    query_results = thread_validation(query_results)
    validation_time = calculate_duration(validation_start_time)
    print(f"Url validation time:\t{validation_time}ms")

    valid_results = [image for image in query_results if not image["dead-link"]]
    invalid_results = [image for image in query_results if image["dead-link"]]

    return valid_results, invalid_results


def update_dead_links(index, invalid_results):
    if len(invalid_results) > 0:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            [
                executor.submit(mark_vectorid_as_dead, index, result["id"])
                for result in invalid_results
            ]
    else:
        print("No updates needed")


def mark_vectorid_as_dead(index, id):
    try:
        index.update(id=id, set_metadata={"dead-link": True})
        print(f"Updated index:\t{id}")
    except Exception as e:
        print(f"Couldnt update index:\t{id}")
        print(f"Error: {e}")


def thread_validation(results):
    urls = [url["url"] for url in results]
    with concurrent.futures.ThreadPoolExecutor() as executor:
        dead_links = list(executor.map(is_dead_link, urls))
    for i, dead_link in enumerate(dead_links):
        results[i]["dead-link"] = dead_link
    return results


def is_dead_link(url):
    try:
        response = requests.get(url, stream=True, timeout=5)
        if response.status_code == 200 and "image" in response.headers.get(
            "Content-Type"
        ):
            return False
        else:
            return True
    except requests.exceptions.RequestException as e:
        print(f"Cannot Reach:\n{url}.\nError: {e}")
        return True
    except TypeError:
        print("Image has no Content-Type header")
        return True


def calculate_duration(start_time):
    return (time.time() - start_time) * 1000


@app.get("/images")
async def image_similarity_search():
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    prev_results = {}

    dead_links = True
    while dead_links:
        image_embedding = get_image_embedding()
        query_results = pinecone_query(image_embedding, index)
        valid_results, invalid_results = validate_results(query_results)
        update_dead_links(index, invalid_results)

        # Some queries will not return 10 images, this check prevents endless loop
        if len(valid_results) >= 10 or prev_results == valid_results:
            dead_links = False
        else:
            prev_results = valid_results
    return valid_results[:10]


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        with open(IMAGE_PATH, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        return {"message": "Upload Successful!"}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


class ImageURL(BaseModel):
    image_url: str


@app.post("/download-image")
async def download_image(image_url: ImageURL):
    try:
        response = requests.get(image_url.image_url, stream=True, timeout=5)
        if response.status_code == 200 and "image" in response.headers.get(
            "Content-Type"
        ):
            image = Image.open(BytesIO(response.content))

            if image.mode == "P":
                image = image.convert("RGBA")
            if image.mode == "RGBA":
                background = Image.new("RGB", image.size, (255, 255, 255))
                background.paste(image, (0, 0), image)
                image = background

            image.save(IMAGE_PATH)
            return {"success": True}
    except Exception as e:
        return {"success": False, "url": image_url.image_url, "error": e}
