import base64
import concurrent.futures
import hashlib
import os
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from io import BytesIO
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from pydantic import BaseModel

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
CACHED_TEXT = None
CACHED_TEXT_EMBEDDING = None

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)
index_info = index.describe_index_stats()


class SearchText(BaseModel):
    searchText: str


class SearchImage(BaseModel):
    image_path: str
    image_base64: str
    image_url: str


def get_image_embedding(image_base64):
    global CACHED_IMAGE_HASH
    global CACHED_EMBEDDING
    start_time = time.time()

    image_bytes = base64.b64decode(image_base64)
    new_image_hash = hashlib.md5(image_bytes).hexdigest()

    if new_image_hash == CACHED_IMAGE_HASH:
        print("Image has not changed. Using cached image embedding.")
        return CACHED_EMBEDDING

    CACHED_IMAGE_HASH = new_image_hash
    print("Computing the image embedding")

    image = Image.open(BytesIO(image_bytes))
    inputs = PROCESSOR(images=image, return_tensors="pt")

    with torch.no_grad():
        image_embeddings = MODEL.get_image_features(**inputs)

    CACHED_EMBEDDING = image_embeddings.cpu().numpy().tolist()
    print(f"Get image embedding execution time: {calculate_duration(start_time)} ms")
    return CACHED_EMBEDDING


def get_text_embedding(text):
    global CACHED_TEXT
    global CACHED_TEXT_EMBEDDING
    start_time = time.time()

    if text == CACHED_TEXT:
        print("Text has not changed. Using cached text embedding")
        return CACHED_TEXT_EMBEDDING
    CACHED_TEXT = text
    inputs = PROCESSOR(text=text, return_tensors="pt")

    with torch.no_grad():
        text_embedding = MODEL.get_text_features(**inputs)

    CACHED_TEXT_EMBEDDING = text_embedding.cpu().numpy().tolist()
    print(f"Get text embedding execution time: {calculate_duration(start_time)} ms")
    return CACHED_TEXT_EMBEDDING


def pinecone_query(embedding, index):
    top_k = 15
    metadata_filter = {"dead-link": {"$ne": True}}

    query_start_time = time.time()
    result = index.query(
        vector=embedding, top_k=top_k, include_metadata=True, filter=metadata_filter
    )
    print(f"Pinecone query execution time: {calculate_duration(query_start_time)} ms")

    query_results = []
    for m in result.matches:
        query_results.append(
            {
                "id": m["id"],
                "url": m["metadata"]["url"],
                "dead-link": False,
                "score": round(m["score"], 5),
                "caption": m["metadata"]["caption"],
            }
        )
    return query_results


def validate_results(query_results):
    validation_start_time = time.time()
    query_results = thread_validation(query_results)
    print(f"Url validation time: {calculate_duration(validation_start_time)}ms")

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


def get_url_content(image_url):
    try:
        response = requests.get(image_url, stream=True, timeout=5)
        if response.status_code == 200 and "image" in response.headers.get(
            "Content-Type"
        ):
            return response.content
        else:
            return b""
    except requests.exceptions.RequestException as e:
        print(f"Cannot Reach:\n{image_url}.\nError: {e}")
        return b""
    except TypeError:
        print("Image has no Content-Type header")
        return b""


def is_dead_link(url):
    response_content = get_url_content(url)
    if response_content == b"":
        return True
    else:
        return False


def calculate_duration(start_time):
    return (time.time() - start_time) * 1000


def similarity_search(embedding, image_num):
    prev_results = {}
    dead_links = True
    while dead_links:
        query_results = pinecone_query(embedding, index)
        valid_results, invalid_results = validate_results(query_results)
        update_dead_links(index, invalid_results)

        # Some queries will not return 10 images, this check prevents endless loop
        if len(valid_results) >= image_num or prev_results == valid_results:
            dead_links = False
        else:
            prev_results = valid_results
    return valid_results[:image_num]


def get_base64_from_url(image_url):
    response_content = get_url_content(image_url)
    image_base64 = base64.b64encode(response_content).decode("utf-8")
    return image_base64


@app.post("/encode")
async def encode_image(image: SearchImage):
    try:
        with open(image.image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
        return {"encoded_image": encoded_string}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/image-search")
async def image_similarity_search(image: SearchImage):
    image_embedding = get_image_embedding(image.image_base64)
    return similarity_search(image_embedding, 10)


@app.post("/text-search")
async def text_similarity_search(search_text: SearchText):
    text_embedding = get_text_embedding(search_text.searchText)
    search_results = similarity_search(text_embedding, 11)
    display_image = search_results[0]
    image_base64 = get_base64_from_url(display_image.get("url"))
    return {"image_base64": image_base64, "search_results": search_results[1:]}


@app.post("/download-image")
async def download_image(image_url: SearchImage):
    return get_base64_from_url(image_url.image_url)


@app.get("/index-size")
async def get_index_size():
    return index_info["total_vector_count"]
