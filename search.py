# ---------------- IMPORTS ----------------
import faiss
import pickle
import numpy as np
import subprocess
from sentence_transformers import SentenceTransformer


# ---------------- CONFIG ----------------
INDEX_PATH = "vector.index"
META_PATH = "metadata.pkl"


# ---------------- LOAD MODELS ----------------
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


# ---------------- STEP 1: LOAD VECTOR STORE ----------------
def load_vector_store():
    index = faiss.read_index(INDEX_PATH)
    with open(META_PATH, "rb") as f:
        metadata = pickle.load(f)
    return index, metadata


# ---------------- STEP 2: EMBED QUERY ----------------
def embed_query(query: str):
    vector = embedding_model.encode([query])
    return np.array(vector).astype("float32")


# ---------------- STEP 3: FAISS SEARCH ----------------
def search_similar_chunks(index, query_vector, top_k=5):
    distances, indices = index.search(query_vector, top_k)
    return distances[0], indices[0]


# ---------------- STEP 4: RETRIEVE CHUNKS ----------------
def retrieve_chunks(metadata, indices):
    results = []
    for idx in indices:
        item = metadata[idx]
        results.append({
            "source": item["source"],
            "chunk_id": item["chunk_id"],
            "text": item["text"]
        })
    return results


# ---------------- STEP 5: BUILD RAG PROMPT ----------------
def build_rag_prompt(query, retrieved_chunks):
    context = ""

    for chunk in retrieved_chunks:
        context += f"Source: {chunk['source']} (Chunk {chunk['chunk_id']})\n"
        context += chunk["text"] + "\n\n"

    return f"""
You are an AI assistant.
Answer the question strictly using the context below.
If the answer is not present in the context, say "I don't know".

Context:
{context}

Question:
{query}

Answer:
"""


# ---------------- STEP 6: GENERATE ANSWER (LOCAL LLM) ----------------
def generate_answer(prompt):
    result = subprocess.run(
        ["ollama", "run", "mistral"],
        input=prompt,
        text=True,
        capture_output=True
    )
    return result.stdout.strip()


# ---------------- MAIN PIPELINE ----------------
if __name__ == "__main__":
    index, metadata = load_vector_store()

    query = "What is artificial intelligence?"
    query_vector = embed_query(query)

    distances, indices = search_similar_chunks(index, query_vector, top_k=5)
    retrieved_chunks = retrieve_chunks(metadata, indices)

    rag_prompt = build_rag_prompt(query, retrieved_chunks)
    answer = generate_answer(rag_prompt)

    print("\n--- FINAL ANSWER ---\n")
    print(answer) 
    
    
    
    
    
    
         
