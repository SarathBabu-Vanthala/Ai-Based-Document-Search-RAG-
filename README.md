# Milestone 1 – Document Ingestion & Indexing

## Objective
Build a robust data pipeline for processing and indexing documents for AI-based search.

## Features Implemented
- Document ingestion (PDF, DOCX, TXT)
- Text cleaning and normalization
- Text chunking with overlap
- Embedding generation using Sentence Transformers
- Vector database setup using FAISS
- Metadata storage for traceability

## Project Structure
- ingest.py – Loads documents from data/docs
- clean.py – Cleans and normalizes text
- chunk.py – Splits text into overlapping chunks
- embed.py – Generates embeddings
- vector_store.py – Stores embeddings in FAISS
- vector.index – FAISS vector database
- metadata.pkl – Stores chunk text and metadata

## How to Run
1. Activate virtual environment
2. Run: `python vector_store.py`

## Status
Milestone 1 completed successfully.
# Ai-Based-Document-Search-RAG-
