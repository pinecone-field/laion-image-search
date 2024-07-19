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

import requests
import torch

from dotenv import load_dotenv
from pinecone import Pinecone

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


def pinecone_query(embedding):
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    top_k = 15
    prev_images = []

    dead_links = True
    while dead_links:
        valid_images = []
        query_results = []
        metadata_filter = {"dead-link": {"$ne": True}} 

        query_start_time = time.time()
        result = index.query(
            vector=embedding, top_k=10, include_metadata=True, filter=metadata_filter
        )
        query_response_time = calculate_duration(query_start_time)
        print(f"Pinecone query execution time: {query_response_time} ms")

        for m in result.matches:
            query_results.append({"id": m["id"], "url": m["metadata"]["url"], "dead-link": False})
        
        validation_start_time = time.time()
        query_results = thread_validation(query_results)
        validation_time = calculate_duration(validation_start_time)
        print(f"Url validation time:\t{validation_time}ms")

        invalid_results = [image for image in query_results if image["dead-link"]]
        thread_updates(index, [id["id"] for id in invalid_results])

        for m in result.matches:
            if len(valid_images) >= 10:
                break
            if m["id"] not in [image["id"] for image in invalid_results]:
                valid_images.append(
                  {
                    "caption": m.metadata["caption"],
                    "url": m.metadata["url"],
                    "score": m.score
                  }
              )
                
        #Some queries will not return 10 images, this check prevents endless loop
        if len(valid_images) >= 10 or prev_images == valid_images:
            dead_links = False

        prev_images = valid_images
    return valid_images

def thread_updates(index, ids):
    if len(ids) > 0:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = [executor.submit(mark_vectorid_as_dead, index, id) for id in ids]
    else:
        print("No updates needed")

def mark_vectorid_as_dead(index, id):
    try:
        index.update(id=id, set_metadata = {"dead-link": True})
        print(f"Updated index:\t{id}")
    except:
        print(f"Couldnt update index:\t{id}")

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
        if response.status_code == 200 and "image" in response.headers.get("Content-Type"): 
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
    image_embedding = get_image_embedding()
    images = pinecone_query(image_embedding)

    return list(images)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        with open(IMAGE_PATH, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        return {"message": "Upload Successful!"}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
