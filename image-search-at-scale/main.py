import os
import time
import hashlib

import shutil
import torch
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pinecone import Pinecone
from transformers import CLIPProcessor, CLIPModel

app = FastAPI()

origins = ["http://localhost:3000",
           "localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
BACKEND_IMAGE_PATH = "./static/image.jpeg"
FRONTEND_IAMGE_PATH = "./search-app/src/assets/image.jpeg"
MODEL = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
PROCESSOR = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

CACHED_IMAGE_HASH = None
CACHED_EMBEDDING = None

def get_image_hash(image_path):
    with open(image_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def get_image_embedding():
    global CACHED_IMAGE_HASH
    global CACHED_EMBEDDING
    start_time = time.time()

    # Get the hash of the new image
    new_image_hash = get_image_hash(BACKEND_IMAGE_PATH)

    # If the hash of the new image is the same as the hash of the cached image,
    # the image has not changed
    if new_image_hash == CACHED_IMAGE_HASH:
        print("Image has not changed. Using cached image embedding.")
        return CACHED_EMBEDDING
    
    CACHED_IMAGE_HASH = new_image_hash
    # If the hash of the new image is the same as the hash of the cached image,
    print("Computing the image embedding")
    image = Image.open(BACKEND_IMAGE_PATH)

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
        dead_link_count = 0
        images = []
        metadata_filter = {"dead-link": {"$ne": True}} 

        query_start_time = time.time()
        result = index.query(
            vector=embedding,
            top_k=10,
            include_metadata=True,
            filter=metadata_filter 
        )
        query_response_time = round((time.time() - query_start_time) * 1000, 0)
        print(f"Pinecone query execution time: {query_response_time} ms")

        for match in result.matches:
            url = match["metadata"]["url"]
            if not validate_url(url):
                print(f'\nRemoving dead link: {url}')
                dead_link_count += 1
                index.update(id=match["id"], set_metadata = {"dead-link": True})

        if dead_link_count == 0:
            dead_links = False

    for m in result.matches:
        images.append({
            "caption": m.metadata["caption"],
            "url": m.metadata["url"],
            "score": m.score
        })
    return images

def validate_url(url):
    try:
        response = requests.get(url, stream=True, timeout=5)
        if response.status_code != 404 and "image" in response.headers.get("Content-Type"): 
            return True
        else:
            return False
    except requests.exceptions.RequestException as e:
        print(f"Cannot Reach:\n{url}.\nError: {e}")
        return False
    
@app.get("/images")
async def image_similarity_search():
    shutil.copy(BACKEND_IMAGE_PATH, FRONTEND_IAMGE_PATH)
    image_embedding = get_image_embedding()
    images = pinecone_query(image_embedding)

    return [image for image in images]

app.mount("/", StaticFiles(directory="static"), name="static")