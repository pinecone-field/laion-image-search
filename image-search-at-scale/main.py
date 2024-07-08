from fastapi import FastAPI
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import hashlib
import torch
from dotenv import load_dotenv
import os
from pinecone import Pinecone
import time
from fastapi.staticfiles import StaticFiles

import requests

app = FastAPI()

load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
IMAGE_PATH = "./static/image.jpeg"
MODEL = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
PROCESSOR = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

CACHED_IMAGE_HASH = None
CACHED_EMBEDDING = None
def get_image_hash(image_path):
    with open(image_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def get_embedding():
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
    # If the hash of the new image is the same as the hash of the cached image,
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

    dead_links = True
    while dead_links:
        start_time = time.time()
        dead_link_count = 0
        images = []
        metadata_filter = {"url": {"$ne": "404"}} 

        result = index.query(
            vector=embedding,
            top_k=10,
            include_metadata=True,
            filter=metadata_filter #Only return images form query where url != 404
        )

        for match in result.matches:
            url = match["metadata"]["url"]
            url_code = get_url_status(url)
            if url_code != 200:
                print(f'\nRemoving dead link: {url}')
                dead_link_count += 1
                new_metadata = {"url": str(url_code)}
                index.update(id=match["id"], set_metadata = new_metadata)

        if dead_link_count == 0:
            dead_links = False
        
        for m in result.matches:
            images.append({
                    "caption": m.metadata["caption"],
                    "url": m.metadata["url"],
                    "score": m.score
                })

        query_response_time = round((time.time() - start_time) * 1000, 0)
        print(f"Pinecone query execution time: {query_response_time} ms")
    return images, query_response_time

def get_url_status(url):
    try:
        code = requests.get(url, stream=True).status_code
        if code in [400, 401, 403, 404, 410, 500, 502, 503, 504]: #Error codes preventing image loading
            return 404
        else:
            return code
    except requests.exceptions.RequestException as e:
        print(f"\nCannot Reach:\n{url}.\nError: {e}\n")
        return 404

@app.get("/images")
async def image_similarity_search():
    image_embedding = get_embedding()
    images, query_response_time = pinecone_query(image_embedding)

    return {"images": images, "query_response_time": query_response_time}

app.mount("/", StaticFiles(directory="static"), name="static")