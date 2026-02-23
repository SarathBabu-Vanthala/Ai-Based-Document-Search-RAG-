from ingest import ingest_documents
DOCS_PATH = "uploaded_docs"
def chunk_text(text, chunk_size=500, overlap=100):
    """
    Splits text into overlapping chunks.

    chunk_size: number of characters per chunk
    overlap: number of characters shared between chunks
    """
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks
# ----------- TEST WITH REAL DOCUMENTS -----------
if __name__ == "__main__":
    docs = ingest_documents(DOCS_PATH)
    for doc in docs: #chunks each docs
        chunks = chunk_text(doc["text"])
        print("FILE:", doc["filename"])
        print("Total characters:", len(doc["text"]))
        print("Number of chunks:", len(chunks))
        print("First chunk preview:", chunks[0][:200])
        print("Last chunk preview:", chunks[-1][:200])
        print("-" * 60)
