from sentence_transformers import SentenceTransformer
from chunk import chunk_text
from ingest import ingest_documents

DOCS_PATH = "uploaded_docs"

# Load embedding model (AI part)
model = SentenceTransformer("all-MiniLM-L6-v2")

if __name__ == "__main__":
    docs = ingest_documents(DOCS_PATH)

    for doc in docs:
        chunks = chunk_text(doc["text"])

        print("FILE:", doc["filename"])
        print("Number of chunks:", len(chunks))
        # Generate embeddings
        embeddings = model.encode(chunks)

        print("Embedding shape:", embeddings.shape)
        print("-" * 60)
