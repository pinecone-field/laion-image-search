import concurrent.futures
import hashlib
import os
import time

from PIL import Image
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import requests
import torch
from transformers import CLIPModel, CLIPProcessor
from pinecone import Pinecone

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
    top_k = 15
    prev_iamges = []

    dead_links = True
    while dead_links:
        images = []
        results = []
        metadata_filter = {"dead-link": {"$ne": True}} 

        query_start_time = time.time()
        result = index.query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True,
            filter=metadata_filter 
        )
        query_response_time = calculate_time(query_start_time)
        print(f"Pinecone query execution time: {query_response_time} ms")

        for m in result.matches:
            results.append({"id": m["id"], "url": m["metadata"]["url"], "dead-link": False})
        
        validation_start_time = time.time()
        results = thread_validation(results)
        validation_time = calculate_time(validation_start_time)
        print(f"Url validation time:\t{validation_time}ms")

        invalid_results = [image for image in results if image["dead-link"]]
        thread_updates(index, [id["id"] for id in invalid_results])

        #Some queries will not return 10 images, this check prevents endless loop
        if top_k - len(invalid_results) >= 10 or prev_iamges == images:
            dead_links = False

        for m in result.matches:
            if len(images) >= 10:
                break
            if m["id"] not in [image["id"] for image in invalid_results]:
                images.append({
                    "caption": m.metadata["caption"],
                    "url": m.metadata["url"],
                    "score": m.score
            })
        prev_iamges = images
    return images, query_response_time

def thread_updates(index, ids):
    if len(ids) > 0:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = [executor.submit(update_id, index, id) for id in ids]
    else:
        print("No updates needed")

def update_id(index, id):
    try:
        index.update(id=id, set_metadata = {"dead-link": True})
        print(f"Updated index:\t{id}")
    except:
        print(f"Couldnt update index:\t{id}")

def thread_validation(results):
    urls = [url["url"] for url in results]
    with concurrent.futures.ThreadPoolExecutor() as executor:
        dead_links = list(executor.map(validate_url, urls))
    for i, dead_link in enumerate(dead_links):
        results[i]["dead-link"] = dead_link
    return results

def validate_url(url):
    try:
        response = requests.get(url, stream=True, timeout=5)
        if response.status_code != 404 and "image" in response.headers.get("Content-Type"): 
            return False
        else:
            return True
    except requests.exceptions.RequestException as e:
        print(f"Cannot Reach:\n{url}.\nError: {e}")
        return True
    except TypeError:
        print("Image has no Content-Type header")
        return True
    
def calculate_time(start_time):
    return (time.time() - start_time) * 1000

    
@app.get("/images")
async def image_similarity_search():
    image_embedding = get_embedding()
    images, query_response_time = pinecone_query(image_embedding)

    return {"images": images, "query_response_time": query_response_time}

app.mount("/", StaticFiles(directory="static"), name="static")