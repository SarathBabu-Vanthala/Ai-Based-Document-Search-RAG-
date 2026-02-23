import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from ingest import ingest_documents
from chunk import chunk_text

DOCS_PATH = "uploaded_docs"
INDEX_PATH = "vector.index"
META_PATH = "metadata.pkl"

# Loading embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

if __name__ == "__main__":
    docs = ingest_documents(DOCS_PATH)

    all_vectors = []
    metadata = []

    for doc in docs:
        chunks = chunk_text(doc["text"])
        embeddings = model.encode(chunks)

        for i, vector in enumerate(embeddings):
            all_vectors.append(vector)
            metadata.append({
                "source": doc["filename"],
                "chunk_id": i,
                "text": chunks[i]
            })

    # Convertion to NumPy array (THIS FIXES THE ERROR)
    vectors_np = np.array(all_vectors).astype("float32")

    # Create FAISS index
    dimension = vectors_np.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(vectors_np)

    # Save index and metadata
    faiss.write_index(index, INDEX_PATH)
    with open(META_PATH, "wb") as f:
        pickle.dump(metadata, f)

    print("FAISS index created successfully")
    print("Vector dimension:", dimension)
    print("Total vectors stored:", index.ntotal)
