from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import hashlib
import torch
from dotenv import load_dotenv
import os
from pinecone import Pinecone
import time
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import requests
import shutil

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
FRONTEND_IAMGE_PATH = "./React/search-app/src/assets/image.jpeg"
TEXT_PATH = "./static/text.txt"
MODEL = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
PROCESSOR = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

CACHED_IMAGE_HASH = None
CACHED_EMBEDDING = None
CACHED_TEXT = None
CACHED_TEXT_EMBEDDING = None 

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

def get_text_embedding():
    global CACHED_TEXT
    global CACHED_TEXT_EMBEDDING
    start_time = time.time()
    f = open(TEXT_PATH, 'r')
    text = f.read()
    f.close()

    #If the text is the same then the embedding is the same
    if text == CACHED_TEXT: 
        print("Text has not changed. Using cached text embedding")
        return CACHED_TEXT_EMBEDDING
    CACHED_TEXT = text
    inputs = PROCESSOR(text = text, return_tensors="pt")

    #Generate text embedding
    with torch.no_grad():
        text_embedding = MODEL.get_text_features(**inputs)

    #Convert text embedding from a numpy array to a list
    CACHED_TEXT_EMBEDDING = text_embedding.cpu().numpy().tolist()
    end_time = time.time()
    print(f"Get image embedding execution time: {(end_time - start_time) * 1000} ms")     
    return CACHED_TEXT_EMBEDDING

def pinecone_query(embedding): 
    start_time = time.time()
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    images = []
    result = index.query(
        vector=embedding, 
        top_k=10,
        include_metadata=True
    )
    
    for m in result.matches:
        images.append({
                "caption": m.metadata["caption"],
                "url": m.metadata["url"],
                "score": m.score
            })
    query_response_time = round((time.time() - start_time) * 1000, 0)
    print(f"Pinecone query execution time: {query_response_time} ms")

def pinecone_query(embedding):
    
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    f = open("dead_links.txt", "a") #contains vector id and url of deleted vectors, separated by a comma


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
            vec_id = match["id"]
            url_code = get_url_status(url)
            if url_code != 200:
                print(f'\nRemoving dead link: {url}')
                dead_link_count += 1
                f.write(vec_id + "," + url + "\n")
                new_metadata = {"url": str(url_code)}
                index.update(id=match["id"], set_metadata = new_metadata)

        if dead_link_count == 0:
            dead_links = False

        query_response_time = round((time.time() - start_time) * 1000, 0)
        print(f"Pinecone query execution time: {query_response_time} ms")

        for m in result.matches:
            images.append({
                    "caption": m.metadata["caption"],
                    "url": m.metadata["url"],
                    "score": m.score
                })
    f.close()
    return images, query_response_time

def get_url_status(url):
    try:
        code = requests.get(url, stream=True).status_code
        if code in [400, 401, 403, 404, 410, 500, 502, 503, 504]: #Error codes preventing image loading
            return 404
        else:
            return code
    except requests.exceptions.RequestException as e:
        print(f"Cannot Reach:\n{url}.\nError: {e}\n")
        return 404
    
def get_removed_vectors():
    removed_vectors = []
    f = open("dead_links.txt", 'r')
    for line in f:
        removed_vectors.append([line[:line.find(',')], line[line.find(',')+1:len(line)-1]])
    return removed_vectors

def get_images():
    image_embedding = get_image_embedding()
    images, query_response_time = pinecone_query(image_embedding)

    return [image for image in images]

@app.get("/images")
async def image_similarity_search():
    return get_images()

@app.post("/upload")
async def upload_file(file:UploadFile = File(...)):
    try:
        with open(BACKEND_IMAGE_PATH, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        shutil.copy(BACKEND_IMAGE_PATH, FRONTEND_IAMGE_PATH)
        return {"message": "Upload Successful!"}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

app.mount("/", StaticFiles(directory="static"), name="static")