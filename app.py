import os
from dotenv import load_dotenv

load_dotenv()

os.environ["TOKENIZERS_PARALLELISM"] = "false"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

from fastapi import FastAPI, UploadFile, File, BackgroundTasks

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from threading import Lock

import faiss
import pickle
import numpy as np
import requests

from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
import docx

from clean import clean_text
from chunk import chunk_text

# ================= APP =================
app = FastAPI(title="KnowledgeAI FINAL WORKING")

from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("🔥 BACKEND ERROR:", str(exc))   # keep error in terminal only

    return JSONResponse(
        status_code=500,
        content={
            "reply": "Something went wrong. Please try again.",
            "confidence": "Low",
            "sources": []
        }
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR="uploaded_docs"
TRASH_DIR="uploaded_docs_trash"
os.makedirs(TRASH_DIR,exist_ok=True)

INDEX_PATH="vector.index"
META_PATH="metadata.pkl"

TRASH_PATH="trash.pkl"

if os.path.exists(TRASH_PATH):
    trash_docs = pickle.load(open(TRASH_PATH,"rb"))
else:
    trash_docs = []


os.makedirs(UPLOAD_DIR,exist_ok=True)
app.mount("/files",StaticFiles(directory=UPLOAD_DIR),name="files")



# ================= MODEL =================
model = SentenceTransformer("BAAI/bge-small-en-v1.5")
DIM=model.get_sentence_embedding_dimension()

from sentence_transformers import CrossEncoder
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
# ================= VECTOR STORE =================
if os.path.exists(INDEX_PATH):
    index=faiss.read_index(INDEX_PATH)
    metadata=pickle.load(open(META_PATH,"rb"))
else:
    index=faiss.IndexFlatL2(DIM)
    metadata=[]

index_lock = Lock()
user_memory_store = {}



# ================= REQUEST =================
class ChatRequest(BaseModel):
    message:str
    history:list|None=None
    docs:list[str]|None=None
    config:dict|None=None   # ⭐ NEW


# ================= EMBED =================
def embed(q):
    vec = model.encode([q.lower()], normalize_embeddings=True)
    return np.array(vec).astype("float32")
# ================= QUERY NORMALIZER =================
def normalize_query(q: str):

    q = q.lower().strip()

    # remove symbols that break matching
    q = q.replace("-", " ")

    # remove duplicate spaces
    q = " ".join(q.split())

    # 🔥 synonym expansion
    synonyms = {
        "dl": "deep learning",
        "ml": "machine learning",
        "ai": "artificial intelligence"
    }

    words = q.split()
    words = [synonyms.get(w, w) for w in words]

    return " ".join(words)

# ================= PRO INTENT ENGINE =================
def detect_intent(q:str):

    q=q.lower()

    if any(x in q for x in [
    "in short","short","brief","summary",
    "in sort","shortly","quick"
    ]):
        return "short"
    
    if any(x in q for x in ["what is","define","meaning"]):
        return "definition"

    if any(x in q for x in ["steps","process","how to","workflow"]):
        return "steps"

    if any(x in q for x in ["difference","vs","compare","comparison"]):
        return "compare"

    if any(x in q for x in ["list","types","examples","features"]):
        return "list"

    return "explain"

# ================= SEMANTIC FOLLOW-UP DETECTOR =================
def is_followup(new_vec, session_memory):

    last_vec = session_memory.get("last_vec")
    if last_vec is None:
        return False

    try:
        a = new_vec[0].astype("float32")
        b = last_vec[0].astype("float32")

        sim = float(
            np.dot(a, b) /
            (np.linalg.norm(a) * np.linalg.norm(b))
        )

        print("FOLLOWUP SIMILARITY:", sim)
        return sim > 0.65

    except Exception as e:
        print("FOLLOWUP ERROR:", e)
        return False

# ================= RETRIEVE =================
def retrieve(vec, selected):

    print("TOTAL INDEX:", index.ntotal)
    print("SELECTED DOCS:", selected)

    if index.ntotal == 0 or len(metadata)==0:
        return []

    if not selected:
        selected_lower = None
    else:
        selected_lower = [s.lower() for s in selected]

    with index_lock:
        _, ids = index.search(vec, 30)

    results = []

    for i in ids[0]:

        if i >= len(metadata):
            continue

        m = metadata[i]
        if m.get("deleted"):
            continue

        # search all docs if none selected
        if selected_lower:
            matched = any(s in m["source"].lower() for s in selected_lower)
            if not matched:
                continue

        try:
            chunk_vec = np.array(m["vector"])
            q_vec = vec[0]

            sim = float(
                np.dot(q_vec, chunk_vec) /
                (np.linalg.norm(q_vec) * np.linalg.norm(chunk_vec))
            )
        except:
            sim = 0.0

        results.append({
            "text": m["text"],
            "source": m["source"],
            "score": 0.0,   # placeholder until rerank
            "vector": m["vector"]
        })

        if len(results) >= 8:
            break

    print("RETRIEVED CHUNKS:", len(results))
    return results



# ================= HISTORY =================
def build_history(history):
    if not history:
        return ""
    try:
        return "\n".join([h["text"] for h in history[-4:]])
    except:
        return ""
    
    
def rerank(query, chunks):
    if not chunks:
        return chunks

    pairs = [[query, c["text"]] for c in chunks]
    scores = reranker.predict(pairs)

    for i, s in enumerate(scores):
        chunks[i]["score"] = float(s)

    chunks.sort(key=lambda x: x["score"], reverse=True)
    return chunks
# ================= ADAPTIVE CONTEXT WINDOW (FIXED VERSION) =================
def build_adaptive_context(query_vec, chunks, max_chars=3000):
    """
    Selects most relevant chunks while respecting token/size limits.
    Uses stored vectors instead of re-embedding text.
    """

    if not chunks:
        return []

    q_vec = query_vec[0]  # already embedded outside
    scored = []

    # ===== UPDATED: Use stored cross-encoder scores only =====
    for c in chunks:
        scored.append((c["score"], c))

    # sort by similarity (highest first)
    scored.sort(key=lambda x: x[0], reverse=True)

    selected = []
    total_len = 0

    for _, c in scored:
        l = len(c["text"])

        if total_len + l > max_chars:
            break

        selected.append(c)
        total_len += l

    print("ADAPTIVE CONTEXT SIZE:", len(selected))
    return selected


# ================= PROMPT =================
# ================= MULTI-DOC REASONING PROMPT =================
def build_prompt(query, history, chunks, session_memory, config=None):

    # ===== DETECT INTENT =====
    intent = detect_intent(query)

    # ===== GROUP CHUNKS BY DOCUMENT SOURCE =====
    docs_context = {}
    for c in chunks:
        src = c["source"]
        if src not in docs_context:
            docs_context[src] = []
        docs_context[src].append(c["text"])

    # ===== BUILD STRUCTURED CONTEXT =====
    structured_context = ""
    for doc, texts in docs_context.items():
        structured_context += f"\n\n### SOURCE DOCUMENT: {doc}\n"
        structured_context += "\n".join(texts[:5])  # limit to avoid overload

    # ===== HISTORY =====
    hist = session_memory["summary"] + "\n" + build_history(history)

    # ===== USER CONFIG PROFILE =====
    config_text = ""
    if config:
        use_case = config.get("useCase", "")
        doc_type = config.get("docType", "")
        config_text = f"""
USER PROFILE:
Use Case: {use_case}
Document Type Focus: {doc_type}

Adjust answer style accordingly.
"""

    # ===== STYLE RULES BASED ON INTENT =====
    if intent == "short":
        style_rules = """
- Give a VERY SHORT answer (1–2 lines max).
- No explanations.
- No extra formatting.
"""
    else:
        style_rules = """
- Always give structured point-to-point answers.
- Use bullet points when possible.
- Use numbered steps if explaining a process.
"""

    # ===== BUILD PROMPT =====
    prompt = f"""
You are a professional AI answering from DOCUMENTS.

INTENT MODE: {intent}

STRICT RESPONSE RULES:
{style_rules}
- Keep sentences short and clear.
- DO NOT invent information.
- ONLY say "I couldn't find information in your documents." if no relevant document content exists.

Conversation Memory:
{hist}

{config_text}

DOCUMENT KNOWLEDGE BASE:
{structured_context}

USER QUESTION:
{query}

FINAL STRUCTURED ANSWER:
"""

    return prompt


# ================= OLLAMA =================
def generate(prompt):

    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",   # fast + free
                "messages": [
                    {"role":"user","content":prompt}
                ],
                "temperature":0.3
            },
            timeout=60
        )

        if res.status_code != 200:
            print("GROQ ERROR:", res.text)
            return ""

        data = res.json()
        return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print("GROQ REQUEST ERROR:", e)
        return ""

# ================= STRUCTURED OUTPUT ENGINE =================
def format_answer(ans:str,intent:str):

    if not ans:
        return ans

    # clean junk tokens from small models
    ans = ans.replace("###","").replace("**","")

    lines=[l.strip() for l in ans.split("\n") if l.strip()]

    # ===== FORCE VISUAL STRUCTURE =====

    if intent=="list":
        lines=[f"• {l}" for l in lines]

    elif intent=="steps":
        lines=[f"{i+1}. {l}" for i,l in enumerate(lines)]

    elif intent=="short":
        return " ".join(lines[:2])

    # definition/explain remain paragraph style

    return "\n".join(lines)

# ================= MEMORY SUMMARIZER =================
def summarize_memory(old_summary,new_history):

    try:
        text="\n".join([h["text"] for h in new_history[-6:]])

        prompt=f"""
Summarize this conversation shortly so an AI can remember context:

Previous Summary:
{old_summary}

New Messages:
{text}

Give short memory summary:
"""

        res=requests.post(
            "http://localhost:11434/api/generate",
            json={"model":"gemma3:1b","prompt":prompt,"stream":False},
            timeout=40
        )

        data=res.json()
        return data.get("response",old_summary)

    except:
        return old_summary

# ================= CHAT =================
@app.post("/chat")
def chat(req:ChatRequest):

    msg = req.message.strip()

    # ===== SESSION MEMORY SETUP =====
    session_id = req.config.get("session", "default") if req.config else "default"
    if len(user_memory_store) > 100:
        print("⚠️ Memory limit exceeded — clearing old sessions")
        user_memory_store.clear()
    if session_id not in user_memory_store:
        user_memory_store[session_id] = {
            "chunks": [],
            "summary": ""
        }

    session_memory = user_memory_store[session_id]

    msg_low = normalize_query(msg)

    
    continue_words = ["more","tell more","more about","continue","explain more"]

    vec = embed(msg_low)

    # semantic follow-up detection
    semantic_followup = is_followup(vec, session_memory)

    use_previous_context = False

    for w in continue_words:
        if msg_low.startswith(w):
            use_previous_context = True

    # only reuse context for SHORT followups
    if semantic_followup:
        use_previous_context = True

    greetings = ["hi","hello","hey","hii"]
    smalltalk = ["how are you","how r u","how are you doing"]

    if msg_low in greetings:
        return {"reply":"Hi 👋 Ask me anything from your documents!","sources":[]}

    if msg_low in smalltalk:
        return {"reply":"I'm good 🙂 Ready to search your documents!","sources":[]}

    # FIXED CONTEXT LOGIC
    if use_previous_context and session_memory.get("chunks"):
        chunks = session_memory["chunks"]
    else:
        chunks = retrieve(vec, req.docs)

    # only rerank on fresh retrieval
        if not semantic_followup:
            chunks = rerank(msg_low, chunks)

    if not chunks:
        print("⚠️ No RAG chunks — using general LLM fallback")

        raw_answer = generate(f"Answer briefly: {msg_low}")

        return {
            "reply": raw_answer or "I couldn't find information.",
            "confidence": "Low",
            "sources": []
        }
    smart_chunks = build_adaptive_context(vec, chunks)
    if not smart_chunks or len(smart_chunks) < 1:
        session_memory["chunks"] = []
        return {
            "reply": "I couldn't find information in your documents.",
            "sources": []
        }

    intent = detect_intent(msg_low)
    prompt = build_prompt(msg_low, req.history, smart_chunks, session_memory, req.config)

    # 🔥 Wrap the dangerous generation step
    try:
        raw_answer = generate(prompt)
        answer = format_answer(raw_answer, intent)
    except Exception as e:
        print("CHAT PIPELINE ERROR:", e)
        return {
            "reply": "Something went wrong while generating the answer.",
            "confidence": "Low",
            "sources": []
        }

    # 🔥 FALLBACK CLEANUP (CORRECT VERSION)
    fallback = "I couldn't find information in your documents."

    if answer and fallback in answer:
        cleaned = answer.replace(fallback, "").strip()

        # only replace if real content still exists
        if len(cleaned) > 20:
            answer = cleaned

    # FINAL SAFETY FALLBACK
    if not answer:
        answer = smart_chunks[0]["text"][:400]

    session_memory["chunks"] = chunks

    # MEMORY SUMMARY UPDATE
    if req.history and len(req.history) % 6 == 0:
        session_memory["summary"] = summarize_memory(session_memory["summary"], req.history)

    # calculate confidence level
    avg_score = sum([c["score"] for c in smart_chunks]) / len(smart_chunks)

    if avg_score > 0.75:
        confidence = "High"
    elif avg_score > 0.55:
        confidence = "Medium"
    else:
        confidence = "Low"

    session_memory["last_vec"] = vec
    return {
        "reply": answer,
        "confidence": confidence,
        "sources": [{"doc": c["source"], "score": round(c["score"],2)} for c in smart_chunks]
    }


# ================= TEXT EXTRACTION =================
def extract_text(name,path,data):

    texts=[]

    if name.lower().endswith(".pdf"):
        reader=PdfReader(path)
        for pg in reader.pages:
            t=pg.extract_text()
            if t:
                texts.append(t)

    elif name.lower().endswith(".docx"):
        d=docx.Document(path)
        texts.append("\n".join([p.text for p in d.paragraphs]))

    elif name.lower().endswith(".txt"):
        texts.append(data.decode(errors="ignore"))

    print("EXTRACTED TEXT LENGTH:",sum(len(t) for t in texts))
    return texts
# ================= ATOMIC VECTOR REBUILD =================
def rebuild_index_atomic():

    global index, metadata

    print("🔄 Atomic rebuild started")

    if len(metadata) == 0:
        index = faiss.IndexFlatL2(DIM)
        with index_lock:
            faiss.write_index(index, INDEX_PATH)
            pickle.dump(metadata, open(META_PATH, "wb"))
        print("✅ Empty index rebuilt")
        return

    try:
        # Build temporary index first
        with index_lock:
            vectors = np.array([m["vector"] for m in metadata]).astype("float32")

        temp_index = faiss.IndexFlatL2(DIM)
        temp_index.add(np.array(vectors).astype("float32"))

        # Replace only after success
        index = temp_index

        with index_lock:
            faiss.write_index(index,INDEX_PATH)
            pickle.dump(metadata,open(META_PATH,"wb"))

        print("✅ Atomic rebuild success")

    except Exception as e:
        print("❌ Atomic rebuild failed:",e)

# ================= BACKGROUND INDEX WORKER =================
def process_file_background(name,path,data):

    global index, metadata

    print("⚙️ Background indexing started:",name)

    raw_texts = extract_text(name,path,data)

    for text in raw_texts:

            cleaned = clean_text(text)
            chunks = chunk_text(cleaned,500,100)

            # ⭐ batch embedding ONCE
            embeddings = model.encode(chunks)

            for ch, emb in zip(chunks, embeddings):
                with index_lock:
                    metadata.append({
                        "text": ch,
                        "source": name,
                        "vector": emb.tolist()
                    })

    # SAFE ATOMIC REBUILD
    rebuild_index_atomic()

    print("✅ Background indexing finished:",name)


# ================= UPLOAD =================
@app.post("/upload")
async def upload(background_tasks: BackgroundTasks, file:UploadFile=File(...)):


    global index, metadata

    name=Path(file.filename).name
    path=os.path.join(UPLOAD_DIR,name)

    data=await file.read()

    with open(path,"wb") as f:
        f.write(data)

    # Start background indexing instead of blocking
    background_tasks.add_task(process_file_background,name,path,data)



    print("TOTAL INDEX AFTER UPLOAD:",index.ntotal)

    return {"status":"ready","file":name}

# ================= DOC LIST =================
@app.get("/documents")
def docs():

    # ONLY show real uploaded files
    files = []

    for f in os.listdir(UPLOAD_DIR):

        # ignore hidden files
        if f.startswith("."):
            continue

        files.append({"name":f})

    return files



# ================= DELETE =================
@app.delete("/documents/{name}")
def delete(name:str):

    global index, metadata

    print("Soft deleting:", name)

    src=os.path.join(UPLOAD_DIR,name)
    dst=os.path.join(TRASH_DIR,name)

    # ===== MOVE TO TRASH INSTEAD OF REMOVE =====
    if os.path.exists(src):
        os.rename(src,dst)

    # ===== REMOVE FROM METADATA =====
    for m in metadata:
        if m["source"] == name:
            m["deleted"] = True


    # ===== REBUILD INDEX =====
    vectors = np.array(
    [m["vector"] for m in metadata if not m.get("deleted")]
    ).astype("float32")

    index = faiss.IndexFlatL2(DIM)

    if len(vectors) > 0:
        index.add(vectors)

    with index_lock:
        faiss.write_index(index,INDEX_PATH)
        pickle.dump(metadata,open(META_PATH,"wb"))
    return {"status":"trashed","file":name}


#=======UNDO ENDPOINT (NEW)======
@app.post("/documents/undo/{name}")
def undo_delete(name:str):

    global metadata

    print("Undo delete:",name)

    src=os.path.join(TRASH_DIR,name)
    dst=os.path.join(UPLOAD_DIR,name)

    # ⭐ Step 1 — physically restore file
    if os.path.exists(src):
        os.rename(src,dst)
        print("File moved back to upload folder:", name)
    else:
        return {"status":"not_found"}

    # ⭐ Step 2 — reactivate metadata
    for m in metadata:
        if m["source"] == name:
            m["deleted"] = False

    # ⭐ Step 3 — SAVE metadata so reload keeps it
    pickle.dump(metadata,open(META_PATH,"wb"))

    return {
        "status":"ready",
        "file":name,
        "visible_files": os.listdir(UPLOAD_DIR)
    }
