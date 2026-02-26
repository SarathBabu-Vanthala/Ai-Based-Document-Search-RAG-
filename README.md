AI Document Search & Knowledge Retrieval

Intelligent RAG-Powered Chatbot for Document Understanding
What It Does
Upload any PDF and chat with it. Ask questions in plain English — get accurate answers with source citations, powered by RAG (Retrieval-Augmented Generation).

System Architecture
User Query
    │
    ▼
[ Embedding Model ]       ← BAAI/bge-small-en-v1.5
    │
    ▼
[ FAISS Vector Search ]   ← Finds relevant document chunks
    │
    ▼
[ LLM API ]               ← Generates grounded answer
    │
    ▼
[ Answer + Citations ]    ← Response with source references
LayerTechPDF ExtractionpdfplumberEmbeddingsBAAI/bge-small-en-v1.5Vector DBFAISSFrontendReact → VercelBackendFastAPI → Render

Quick Start
bash# Clone
git clone https://github.com/your-username/ai-document-search.git
cd ai-document-search

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env        # Add your LLM API key
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev                 # http://localhost:3000

Key Features

📄 PDF upload & text extraction via pdfplumber
🔍 Semantic search with FAISS vector database
💬 Multi-turn chat with conversation memory
📎 Source citations with every answer
☁️ Deployed on Vercel + Render


Milestones
#MilestoneDone1Document Ingestion & FAISS Indexing✅ Jan 82RAG Pipeline + LLM Integration✅ Jan 183Chat UI + Dialogue Management✅ Jan 284Deployment & Final Evaluation✅ Live

Future Plans

OCR support for scanned PDFs
Multi-document comparison
User authentication & document vaults
Voice interface
Google Drive / OneDrive integration
