# Image Search at Scale
This demo re-uses Chris Amata's excellent image search demo.

![Demo](./static/image-search-at-scale.png)

### Step 1 - Install dependencies

Setup virtual environment and install the required python packages. 

```
cd ./image-search-at-scale
pip install poetry
poetry install
poetry shell
```

### Step 2 - Set environment variables
Create a file named ```.env``` that has the following variables:

```
PINECONE_INDEX_NAME=laion-400m
PINECONE_API_KEY=[YOUR_PINECONE_API_KEY]
```

## Step 3 - Run FastAPI
Start demo API by running the following command.

```
uvicorn main:app --reload
```

## Demo Script
1. [OPTIONAL] Open a browser for this url: http://localhost:8000/docs. You can test the backend API call here and talk about how any user interface could be built on top of this endpoint.

1. Open this url: http://localhost:8000/index.html. You can swap the image out
by doing a search on http://images.google.com and saving the image to the ```./static/image.jpeg``` file. 

1. Refresh http://localhost:8000/index.html and similarity search will re-run against the new image.

1. Click on the ```Pinecone Logo```. It will direct link you to the index that drives this demo.

1. Show the FastAPI Console Output. The terminal output for the FastAPI application includes the following execution times: ```Get image embedding execution time in ms``` and ```Pinecone query execution time in ms```

**IMPORTANT** - Subsequent pinecone query times should drop after the initial request. 
But, this is a very large dataset. Expect queries to range from a 300ms to 5000ms.  