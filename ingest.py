import os
import pdfplumber
from docx import Document
from clean import clean_text
DOCS_PATH = "uploaded_docs"
def extract_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text
def extract_docx(path):
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)
def extract_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
def ingest_documents(folder):
    documents = []

    for file in os.listdir(folder):
        path = os.path.join(folder, file)

        if file.endswith(".pdf"):
            raw_text = extract_pdf(path) 
        elif file.endswith(".docx"):
            raw_text = extract_docx(path) 
        elif file.endswith(".txt"): 
            raw_text = extract_txt(path) 
        else:
            continue
        cleaned_text = clean_text(raw_text) 
        documents.append({
            "filename": file,
            "text": cleaned_text
        })
    return documents
if __name__ == "__main__":
    docs = ingest_documents(DOCS_PATH)

    for d in docs:
        print("FILE:", d["filename"])
        print(d["text"])   
        print("-" * 60)
