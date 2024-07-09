import json
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import argparse
import time
import requests
import random
from datetime import date
import os
from pinecone import Pinecone
import subprocess

load_dotenv()

API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE")

news_sections = ["us", "world", "politics", "business", "health", "entertainment", "style", "travel", "sports"]

def scrape_headlines():
    headlines = []
    headlines_file = "data/cnn_headlines.jsonl"
    for section in news_sections:
        # Make a request to the website
        response = requests.get(f"https://www.cnn.com/{section}")

        # Parse the HTML content
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all span elements with data-editable="headline"
        spans = soup.select('span[data-editable="headline"]')

        print(f"Found {len(spans)} headlines for {section}")
        for span in spans:
            headlines.append({"headline": span.get_text(), "section": section})
    with open(headlines_file, 'w') as f:
        for h in headlines:
            jsonl_element = {}
            jsonl_element['section'] = h['section']
            jsonl_element['headline'] = h['headline']
            f.write(json.dumps(jsonl_element) + '\n')
        print(f"Wrote {len(headlines)} to {headlines_file}")
    return headlines

def get_article_urls(section):
    articles = []
    response = requests.get(f"https://www.cnn.com/{section}")

    # Parse the HTML content
    soup = BeautifulSoup(response.content, 'html.parser')
    links = soup.select('a[data-link-type="article"]')
    site_prefix = "http://cnn.com"
    for link in links:
        articles.append(f"{site_prefix}{link['href']}")

    articles_no_duplicates = list(set(articles))

    return list(articles_no_duplicates)

def get_article_texts(urls):
    texts = []
    for url in urls:
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            script_tag = soup.find('script', {'type': 'application/ld+json'})

            # Extract and parse the JSON content
            data = json.loads(script_tag.string)
            text = data['articleBody']
            texts.append({"url": url, "text": text, "scrape_date": date.today().strftime("%m/%d/%Y")})
            print(f"Extracted article from {url}")
            time.sleep(random.uniform(.5, 3))  
        except Exception as e:
            print(f"Error extracting article from {url}: {e}")
    print(f"Extracted {len(texts)} articles")
    return texts

def get_article_id(url):
    s = url
    s = s[15:]
    s = s.replace("/", "_")
    s = s[:-11]
    return s

def create_jsonl_file(section, texts):
    with open(f'data/canopy/cnn_articles_{section}.jsonl', 'w') as f:
        for text in texts:
            doc_id = get_article_id(text['url'])
            jsonl_element = {}
            jsonl_element['id'] = doc_id
            jsonl_element['text'] = text['text']
            jsonl_element['source'] = text['url']
            jsonl_element['metadata'] = {"scrape_date": text['scrape_date'], "section": section}
            f.write(json.dumps(jsonl_element) + '\n')
            print(f"Wrote article as doc_id: {doc_id} to jsonl file")
    print(f"Wrote {len(texts)} articles to data/canopy/cnn_articles_{section}.jsonl")

def scrape_cnn():
    scrape_headlines()
    for section in news_sections:
        urls = get_article_urls(section)
        texts = get_article_texts(urls)
        create_jsonl_file(section, texts)

def upsert():
    command = f"echo y | canopy upsert ./data/canopy --index-name {PINECONE_INDEX_NAME} -n {PINECONE_NAMESPACE}"
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(result.stderr)
    print("Upserting data")
    print("Output:", result.stdout)
    print("Errors:", result.stderr)

def delete_data():
    pc = Pinecone(api_key=API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    index.delete(delete_all=True, namespace=PINECONE_NAMESPACE)
    print(f"Deleted all vectors in index: {PINECONE_INDEX_NAME} for namespace: {PINECONE_NAMESPACE}")

def main():
    parser = argparse.ArgumentParser(description="CLI for upserting and deleted pinecone index data")
    parser.add_argument("action", choices=["scrape_cnn", "upsert", "delete"], help="Action to perform: 'scrape_cnn' to scrape data from CNN, 'upsert' to insert or update data, 'delete' to delete all data in wbd namespace")
    args = parser.parse_args()

    if args.action == "scrape_cnn":
        scrape_cnn()
    elif args.action == "upsert":
        upsert()
    elif args.action == "delete":
        delete_data()

if __name__ == "__main__":
    main()