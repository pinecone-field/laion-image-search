# CNN RAG + Image Search at Scale Demo
These demos provide a pre-built way to demonstrate Pinecone differentiators.
Each demo is self contained and can be run with minimal setup/effort.

### cnn-rag
Showcase RAG with CNN news articles. Leverages 
Vamshi Enabothala's AWS Application. [Demo Script + Details](./cnn-rag/README.md)

1. Chat engine to interact with data via a react based web front end
1. Context engine to retrieve context from Pinecone serverless via AWS hosted canopy
1. Automatically chunk and transform text data into embeddings via local environment
1. Industry leader in recall(validate via RAGAS and faithfulness scoring)

### image-search-at-scale
Leverages Chris Amata's image search application to search the LAOIN 400M dataset. [Demo Script + Details](./image-search-at-scale/README.md)

1. Prebuilt pinecone index contains 278M embeddings to make it safe for corporate use.
1. Displays query response time - query 278M images in 300ms-5000ms
1. Run similarity search against any .jpeg image
1. Industry leader in recall(validate via visual confirmation)