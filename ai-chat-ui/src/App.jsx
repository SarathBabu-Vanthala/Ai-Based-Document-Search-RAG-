// ===== FULL FINAL FRONTEND (WORKING) =====
import { useState, useRef, useEffect } from "react";
import { Send, Upload, FileText, Plus, Sparkles, Moon, Sun,
  Star, Share2, Settings, Copy, Volume2, Menu, X, Trash2, Eye, Home, User, Github, Linkedin, Mail
} from "lucide-react";


export default function App({ userConfig, goHome })

{
console.log(userConfig.useCase);
const [savedChats,setSavedChats]=useState(()=>{
const saved=localStorage.getItem("knowledgeTabs");
if(saved) return JSON.parse(saved);
return [{
id:1,
title:"Chat 1",
messages:[{
  id: Date.now(),
  role:"assistant",
  content:"Hi 👋 Ask me anything from your documents!"
}]
,
history:[]
}];
});

const [openTabs,setOpenTabs]=useState(()=>{
  return JSON.parse(localStorage.getItem("openTabs")) || [1];
});
const [activeTab,setActiveTab]=useState(()=>{
  return JSON.parse(localStorage.getItem("activeTab")) || 1;
});
const [settingsTab,setSettingsTab]=useState("history");


const [selectedDocs,setSelectedDocs]=useState(()=>{
return JSON.parse(localStorage.getItem("selectedDocs")||"[]");
});

const [input,setInput]=useState("");
const [documents,setDocuments]=useState([]);
const [darkMode,setDarkMode]=useState(true);
const [sidebar,setSidebar]=useState(true);
const [loading,setLoading]=useState(false);
const [streaming,setStreaming]=useState(false);
const [activeMenu,setActiveMenu]=useState(null);
const [showSettings,setShowSettings]=useState(false);
const [indexingFiles,setIndexingFiles]=useState([]);
const [copiedId,setCopiedId]=useState(null);
const [speakingId,setSpeakingId]=useState(null);
const [lastDeleted,setLastDeleted]=useState(null);
const [docSearch,setDocSearch]=useState("");
const [chatMenu,setChatMenu]=useState(null);
const [renamingId,setRenamingId]=useState(null);
const [renameText,setRenameText]=useState("");
const [hydrated,setHydrated] = useState(false);
const [showContact,setShowContact]=useState(false);

const [trashDocs,setTrashDocs]=useState(()=>{
  return JSON.parse(localStorage.getItem("trashDocs")||"[]");
});


const messagesEndRef=useRef(null);
const messageRefs=useRef({});
const tabRefs = useRef({});

useEffect(()=>{
 if(!hydrated) return;

 if(!savedChats.find(c=>c.id===activeTab)){
   setActiveTab(savedChats[0]?.id);
 }
},[savedChats,activeTab,hydrated]);

const currentTab=savedChats.find(t=>t.id===activeTab);
// ===== ENSURE ONE BUILT-IN CHAT ALWAYS EXISTS =====
useEffect(()=>{
  if(savedChats.length===0){
    const baseChat={
      id:1,
      title:"Chat 1",
      messages:[{
  id: Date.now()+Math.random(),
  role:"assistant",
  content:"Hi 👋 Ask me anything from your documents!"
}]
,
      history:[]
    };
    setSavedChats([baseChat]);
    setOpenTabs([1]);
    setActiveTab(1);
  }
},[savedChats]);

useEffect(()=>{
localStorage.setItem("knowledgeTabs",JSON.stringify(savedChats));
},[savedChats]);

useEffect(()=>{
localStorage.setItem("selectedDocs",JSON.stringify(selectedDocs));
},[selectedDocs]);

useEffect(()=>{
  localStorage.setItem("trashDocs",JSON.stringify(trashDocs));
},[trashDocs]);

useEffect(()=>{
  localStorage.setItem("openTabs",JSON.stringify(openTabs));
},[openTabs]);

useEffect(()=>{
  localStorage.setItem("activeTab", JSON.stringify(activeTab));
}, [activeTab]);

useEffect(()=>{
  setHydrated(true);
},[]);

const loadDocs=()=>{
fetch("https://ai-based-document-search-rag.onrender.com/documents")
.then(r=>r.json())
.then(data=>{
  setDocuments([...data]);
});
};



useEffect(()=>{loadDocs();},[]);

useEffect(()=>{
messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
},[currentTab?.messages,loading]);

useEffect(()=>{
  if(streaming){
    messagesEndRef.current?.scrollIntoView({behavior:"auto"});
  }
},[currentTab?.messages]);


// ===== AUTO HIDE DELETE POPUP AFTER 5s =====
useEffect(()=>{

  if(!lastDeleted) return;

  const timer=setTimeout(()=>{
    setLastDeleted(null);
  },5000); // 5 seconds

  return ()=>clearTimeout(timer);

},[lastDeleted]);




const shareChat=()=>{
if(!currentTab) return;
navigator.clipboard.writeText(currentTab.messages.map(m=>m.content).join("\n"));
alert("Chat copied");
};
const exportMarkdown = () => {

  if(!currentTab || !currentTab.messages?.length){
    console.warn("No chat data to export");
    return;
  }

  const text = currentTab.messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentTab.title || "chat"}.txt`;
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
  a.remove();
};


const exportPDF = () => {

  if(!currentTab || !currentTab.messages?.length){
    console.warn("No chat data to export");
    return;
  }

  const html = `
    <html>
      <head>
        <title>${currentTab.title}</title>
        <style>
          body { font-family: sans-serif; padding:20px; }
          p { margin-bottom:12px; }
        </style>
      </head>
      <body>
        ${currentTab.messages.map(m=>`
          <p><b>${m.role}:</b> ${m.content}</p>
        `).join("")}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type:"text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentTab.title || "chat"}.html`;
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
  a.remove();
};


const favouriteChat=()=>{

if(!currentTab) return;

const old=JSON.parse(localStorage.getItem("favChats")||"[]");
const exists=old.find(c=>c.id===currentTab.id);

let updated;

if(exists){
updated=old.filter(c=>c.id!==currentTab.id);
}else{
updated=[...old,currentTab];
}

localStorage.setItem("favChats",JSON.stringify(updated));

// trigger instant UI refresh safely
setSettingsTab(prev=>prev==="fav"?"history":"fav");
setTimeout(()=>setSettingsTab("fav"),0);

};



const newChat=()=>{
const id=Date.now();
const chat={
id,
title:`Chat ${savedChats.length+1}`,
messages:[{role:"assistant",content:"Hi 👋 Ask me anything from your documents!"}],
history:[]
};
setSavedChats(p=>[...p,chat]);
setOpenTabs(p=>[...p,id]);
setActiveTab(id);
};

const closeChat=(id)=>{
if(openTabs.length===1)return;
const n=openTabs.filter(t=>t!==id);
setOpenTabs(n);
if(activeTab===id)setActiveTab(n[0]);
};

const openFromSidebar=(id)=>{
if(!openTabs.includes(id))setOpenTabs(p=>[...p,id]);
setActiveTab(id);
};

const deleteChat=(id)=>{
setSavedChats(p=>p.filter(c=>c.id!==id));
setOpenTabs(p=>p.filter(t=>t!==id));
};

const saveRename=(id)=>{

if(!renameText.trim()){
setRenamingId(null);
return;
}

setSavedChats(prev =>
prev.map(c =>
c.id===id ? {...c,title:renameText} : c
)
);

setRenamingId(null);
};




const viewDoc=(name)=>{
window.open(`https://ai-based-document-search-rag.onrender.com/files/${name}`,"_blank");
setActiveMenu(null);
};

const deleteDoc = async (name) => {

  try {

    // ✅ CALL BACKEND SO FILE ACTUALLY MOVES TO TRASH_DIR
    await fetch(`https://ai-based-document-search-rag.onrender.com/documents/${name}`, {
      method: "DELETE"
    });

    // ✅ update UI instantly
    setTrashDocs(p => [...p, name]);
    setDocuments(prev => prev.filter(d => d.name !== name));

    setLastDeleted(name);
    setActiveMenu(null);

  } catch (err) {
    console.error("Delete failed:", err);
  }
};



//undoDelete()
const undoDelete = async () => {

  if(!lastDeleted) return;

  try{

    await fetch(`https://ai-based-document-search-rag.onrender.com/documents/undo/${lastDeleted}`,{
      method:"POST"
    });

    // reload real backend state
    loadDocs();

    // remove from trash UI
    setTrashDocs(p=>p.filter(t=>t!==lastDeleted));

  }catch(e){
    console.error("UNDO FAILED",e);
  }

  setLastDeleted(null);
};






// ===== STREAMING FUNCTION (ADD ONLY) =====
const streamReply = (fullText) => {
  if(!currentTab) return;

  let index = 0;
  setStreaming(true);

  const interval = setInterval(() => {

    index++;

    setSavedChats(prev =>
      prev.map(t=>{
        if(t.id!==activeTab) return t;

        const msgs=[...t.messages];
        msgs[msgs.length-1] = {
          role:"assistant",
          content: fullText.slice(0,index)
        };

        return {...t,messages:msgs};
      })
    );

    if(index>=fullText.length){
      clearInterval(interval);
      setStreaming(false);
    }

  },10); // speed (lower=faster typing)
};

const sendMessage=async()=>{

if(!input.trim()||!currentTab)return;

const text=input;
const msgIndex=currentTab.messages.length;

setInput("");
setLoading(true);

setSavedChats(p=>p.map(t=>t.id===activeTab?{
...t,
messages:[
  ...t.messages,
  {
    id: Date.now() + Math.random(),
    role:"user",
    content:text
  }
],

history:[...t.history,{text,tabId:t.id,msgIndex}]
}:t));

try{
const res=await fetch("https://ai-based-document-search-rag.onrender.com/chat",{
method:"POST",
headers:{"Content-Type":"application/json"},
body: JSON.stringify({
  message: text,
  history: currentTab.history,
  docs: selectedDocs,
  config: userConfig
})


});
const data=await res.json();

// Add empty assistant message first
// Add empty assistant message first (with metadata)
setSavedChats(prev =>
  prev.map(t=>t.id===activeTab
    ? {
        ...t,
        messages:[
          ...t.messages,
          {
            id: Date.now() + Math.random(),
            role:"assistant",
            content:"",
            confidence:data.confidence,
            sources:data.sources
          }

        ]
      }
    : t
  )
);


// Stream text gradually
streamReply(data.reply || "No answer");


}catch{
setSavedChats(p=>p.map(t=>t.id===activeTab?{
...t,
messages:[...t.messages,{role:"assistant",content:"⚠️ Backend error"}]
}:t));
}finally{
setLoading(false);
}
};
const speak = (text,id)=>{

  if(speakingId===id){
    speechSynthesis.cancel();
    setSpeakingId(null);
    return;
  }

  speechSynthesis.cancel();

  const clean = text.replace(/[^\w\s.,]/g,"");

  const utter = new SpeechSynthesisUtterance(clean);

  // ===== LOAD AVAILABLE VOICES =====
  const voices = speechSynthesis.getVoices();

  console.log("AVAILABLE VOICES:",voices);

  // ⭐ CHANGE VOICE HERE
  // Try Indian English first
const selectedVoice =
  voices.find(v =>
    v.name.toLowerCase().includes("female")
  );

if (!selectedVoice) {
  console.warn("No female voice found");
  return;
}

utter.voice = selectedVoice;

  if(selectedVoice){
    utter.voice = selectedVoice;
  }

  // ⭐ Voice tuning
  utter.rate = 1;     // speed (0.5 slow → 1.5 fast)
  utter.pitch = 1;    // tone (0 low → 2 high)
  utter.volume = 1;   // volume

  utter.onend=()=>{
    setSpeakingId(null);
  };

  setSpeakingId(id);
  speechSynthesis.speak(utter);
};



const copyMsg=(text,id)=>{
  navigator.clipboard.writeText(text);
  setCopiedId(id);

  setTimeout(()=>{
    setCopiedId(null);
  },1500);
};

const editMessage = (index) => {

  if(!currentTab) return;

  const msg = currentTab.messages[index];

  if(!msg || msg.role !== "user") return;

  // Just preload text into input
  setInput(msg.content);

};


//Mouse Move Handler
const handleMagnetMove = (e, id) => {

  const el = tabRefs.current[id];
  if(!el) return;

  const rect = el.getBoundingClientRect();

  const x = e.clientX - (rect.left + rect.width/2);
  const y = e.clientY - (rect.top + rect.height/2);

  // magnetic motion
  el.style.transform = `translate(${x*0.15}px, ${y*0.15}px)`;

  // ⭐ glow follow cursor
  const glowX = e.clientX - rect.left;
  const glowY = e.clientY - rect.top;

  el.style.setProperty("--glow-x", `${glowX}px`);
  el.style.setProperty("--glow-y", `${glowY}px`);

  const before = el.querySelector(":scope::before");
};
const resetMagnet = (id)=>{
  const el = tabRefs.current[id];
  if(!el) return;
  el.style.transform = "translate(0px,0px)";
};

const mainBg=darkMode?"bg-slate-950 text-white":"bg-white text-black";
const sideBg=darkMode?"bg-slate-900/40":"bg-gray-100";
const aiBubble=darkMode?"bg-slate-800/60 border-slate-700":"bg-gray-200 border-gray-300";
const favChats=JSON.parse(localStorage.getItem("favChats")||"[]");
const isFav=favChats.find(c=>c.id===currentTab?.id);

return(
<div className={`h-screen w-screen flex ${mainBg}`}>

<button onClick={()=>setSidebar(!sidebar)}
className="absolute left-4 top-4 p-2 bg-slate-800/40 rounded-lg z-50">
<Menu size={16}/>
</button>

{sidebar && (
<aside className={`w-80 border-r ${sideBg} flex flex-col`}>
<div className="p-6 flex items-center gap-3">
<Sparkles size={18}/>
<div>
<h1 className="font-semibold">KnowledgeAI</h1>
<p className="text-xs opacity-70">Document Intelligence System</p>
</div>
</div>

<div className="px-6 text-xs opacity-70 mb-2">
{documents.length} files uploaded
</div>

<div className="px-6 mb-3">
<input
value={docSearch}
onChange={(e)=>setDocSearch(e.target.value)}
placeholder="Search files..."
className="w-full bg-slate-800/40 rounded-lg px-3 py-2 text-sm outline-none"
/>
</div>

<div className="px-6 flex-1 overflow-y-auto">
{documents
.filter(d=>d.name.toLowerCase().includes(docSearch.toLowerCase()))
.map(doc=>(

<div key={doc.name} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-800/20 relative">
<input type="checkbox"
checked={selectedDocs.includes(doc.name)}
onChange={()=>setSelectedDocs(p=>p.includes(doc.name)?p.filter(d=>d!==doc.name):[...p,doc.name])}/>
<FileText size={14}/>
<div className="flex-1 flex items-center justify-between">
<span>{doc.name}</span>

{indexingFiles.includes(doc.name) && (
<span className="text-xs text-yellow-400 animate-pulse">
⚙️Indexing...
</span>
)}
</div>

<button onClick={()=>setActiveMenu(activeMenu===doc.name?null:doc.name)}>⋮</button>

{activeMenu===doc.name && (
<div className="absolute right-2 top-8 bg-black text-white rounded-lg text-xs shadow-lg z-50">
<button onClick={()=>viewDoc(doc.name)} className="flex gap-2 px-3 py-2 hover:bg-slate-700 w-full">
<Eye size={14}/> View
</button>
<button onClick={()=>deleteDoc(doc.name)} className="flex gap-2 px-3 py-2 text-red-400 hover:bg-slate-700 w-full">
<Trash2 size={14}/> Delete
</button>
</div>
)}
</div>
))}

<div className="mt-4 space-y-1">
{savedChats.map(chat=>(
<div key={chat.id} className="flex items-center justify-between">
<button onClick={()=>openFromSidebar(chat.id)} className="text-left w-full p-2 rounded hover:bg-slate-800/20 text-sm">
💬 {chat.title}
</button>
<button onClick={()=>deleteChat(chat.id)} className="text-red-400">
<Trash2 size={12}/>
</button>
</div>
))}
</div>
</div>

<div className="p-6 space-y-3">
<label className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 flex justify-center gap-2 cursor-pointer text-sm text-white">
<Upload size={16}/> Upload
<input hidden type="file"
onChange={async(e)=>{
const file=e.target.files[0];
const f=new FormData();
f.append("file",file);

setIndexingFiles(p=>[...p,file.name]);

const res=await fetch("https://ai-based-document-search-rag.onrender.com",{method:"POST",body:f});
const data=await res.json();

loadDocs();

// simulate background indexing completion
setTimeout(()=>{
setIndexingFiles(p=>p.filter(n=>n!==file.name));
},4000);
}}
/>
</label>

<button onClick={newChat} className="p-3 bg-slate-800/40 rounded-xl flex justify-center gap-2">
<Plus size={16}/> New Chat
</button>

<button onClick={()=>setShowSettings(true)} className="p-3 bg-slate-800/40 rounded-xl flex justify-center gap-2">
<Settings size={16}/> Settings
</button>
<button
  onClick={goHome}
  className="p-3 bg-slate-800/40 rounded-xl flex justify-center gap-2"
>
  🏠 Home
</button>
{/* USER CONTACT ICON */}
<div className="relative flex items-center">

  <button
    onClick={() => setShowContact(!showContact)}
    className="ml-2 p-2 rounded-xl hover:bg-neutral-800 transition"
  >
    <User size={20}/>
  </button>

  {/* PANEL OPENS ABOVE */}
  {showContact && (
    <div className="
      absolute
      bottom-full
      right-0
      mb-2
      w-52
      bg-neutral-900
      border border-neutral-700
      rounded-2xl
      shadow-xl
      p-3
      space-y-3
      z-50
    ">

      <a
        href="https://github.com/SarathBabu-Vanthala"
        target="_blank"
        className="flex items-center gap-2 hover:text-blue-400"
      >
        <Github size={18}/> Github
      </a>

      <a
        href="https://www.linkedin.com/in/sarathbabu-vanthala-a754b0321/"
        target="_blank"
        className="flex items-center gap-2 hover:text-blue-400"
      >
        <Linkedin size={18}/> LinkedIn
      </a>

      <a
  href="https://mail.google.com/mail/?view=cm&to=sarathbabuvanthala@gmail.com"
  target="_blank"
  className="flex items-center gap-2 hover:text-blue-400"
>
  <Mail size={18}/> Gmail
</a>

    </div>
  )}

</div>

</div>
</aside>
)}

<main className="flex-1 flex flex-col relative">

<div className="absolute top-4 right-6 flex gap-2 z-50">

<button onClick={()=>setDarkMode(!darkMode)} className="p-2 bg-slate-800/40 rounded-lg">
{darkMode?<Sun size={16}/>:<Moon size={16}/>}
</button>
<button onClick={shareChat} className="p-2 bg-slate-800/40 rounded-lg"><Share2 size={16}/></button>
<button
onClick={favouriteChat}
className={`p-2 bg-slate-800/40 rounded-lg ${isFav?"text-yellow-400":""}`}>
<Star size={16}/>
</button>
<button onClick={exportMarkdown} className="p-2 bg-slate-800/40 rounded-lg">
TXT-F
</button>

<button onClick={exportPDF} className="p-2 bg-slate-800/40 rounded-lg">
PDF-F
</button>


</div>
{/* line for tab alignment */}
<div className="flex gap-2 px-6 pt-16 relative z-10">


{openTabs.map(id=>{
  const t = savedChats.find(c=>c.id===id);
  if(!t) return null;

  return(
    <div
      key={id}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full text-sm cursor-pointer
        ${hydrated && id===activeTab
        ? "bg-violet-600 text-white"
        : "bg-slate-700/30"}
      `}
    >

      {/* ===== CHAT TITLE OR RENAME INPUT ===== */}
      {renamingId===id ? (
        <input
          value={renameText}
          autoFocus
          onChange={(e)=>setRenameText(e.target.value)}
          onBlur={()=>saveRename(id)}
          onKeyDown={(e)=>e.key==="Enter"&&saveRename(id)}
          className="bg-transparent outline-none text-sm px-2 border border-violet-500/40 rounded"
        />
      ):(
        <span onClick={()=>setActiveTab(id)}>
          {t.title}
        </span>
      )}

      {/* ===== THREE DOTS ===== */}
      <button
        onClick={(e)=>{
          e.stopPropagation();
          setChatMenu(prev=>prev===id?null:id);
        }}
        className="opacity-70 hover:opacity-100"
      >
        ⋮
      </button>

      {/* ===== DROPDOWN MENU ===== */}
      {chatMenu===id && (
        <div className="absolute top-9 right-0 bg-slate-900 border border-slate-700 rounded-lg text-xs shadow-xl z-50">

          <button
            onClick={()=>{
              setRenamingId(id);
              setRenameText(t.title);
              setChatMenu(null);
            }}
            className="block w-full text-left px-3 py-2 hover:bg-slate-700"
          >
            ✏️ Rename
          </button>

          <button
            onClick={()=>{
              deleteChat(id);
              setChatMenu(null);
            }}
            className="block w-full text-left px-3 py-2 text-red-400 hover:bg-slate-700"
          >
            🗑 Delete
          </button>

        </div>
      )}

    </div>
  );
})}

</div>


<div className="flex-1 overflow-y-auto p-10 space-y-6">
{currentTab?.messages.map((m,i)=>(
<div key={m.id}

ref={el=>messageRefs.current[`${currentTab.id}-${i}`]=el}
className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
<div
className={`px-5 py-3 rounded-2xl border max-w-2xl
${m.role==="user"
  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
  : `${aiBubble} ${streaming && i===currentTab.messages.length-1 ? "ai-pulse" : ""}`
}`}
>

<div>
  {/* ===== MAIN ANSWER ===== */}
  <div className="whitespace-pre-wrap">
  {m.content}
</div>

  {/* ===== SOURCE DISPLAY (BELOW ANSWER) ===== */}
  {m.sources && (
    <div className="text-xs mt-2 opacity-70 border-t border-slate-700 pt-2">
      📄 Source: {[...new Set(m.sources.map(s=>s.doc))].join(", ")
}
    </div>
  )}

  {/* ===== CONFIDENCE (IF EXISTS) ===== */}
  {m.confidence && (
    <div className="text-xs opacity-60">
      ⚡ Confidence: {m.confidence}
    </div>
  )}

  {/* ===== COPY + VOICE ACTIONS ===== */}
  {/* ===== ACTION BUTTONS (USER + ASSISTANT) ===== */}
<div className="flex gap-3 mt-2 text-xs opacity-70 items-center">

  {/* VOICE */}
  <button onClick={()=>speak(m.content,i)}>
    <Volume2 size={14}/>
  </button>

  {speakingId===i && (
    <div className="flex gap-[2px] items-end h-4">
      <div className="w-[2px] h-2 bg-violet-400 animate-bounce"/>
      <div className="w-[2px] h-3 bg-violet-400 animate-bounce delay-75"/>
      <div className="w-[2px] h-1 bg-violet-400 animate-bounce delay-150"/>
    </div>
  )}

  {/* COPY */}
  <button onClick={()=>copyMsg(m.content,i)}>
    <Copy size={14}/>
  </button>

  {copiedId===i && (
    <span className="text-green-400">Copied ✓</span>
  )}

  {/* EDIT — ONLY FOR USER MESSAGE */}
  {m.role==="user" && (
    <button onClick={()=>editMessage(i)}>
      Edit
    </button>
  )}

</div>

  
</div>



{streaming && i===currentTab.messages.length-1 && (
  <span className="ai-cursor">▌</span>
)}

</div>
</div>
))}
{loading && !streaming && <div>Thinking...</div>}
{streaming && <div className="opacity-60 text-sm">AI typing...</div>}

<div ref={messagesEndRef}/>
</div>

<div className="p-6 border-t border-slate-800/30">
<div className="backdrop-blur-xl bg-slate-800/50 p-3 rounded-2xl flex gap-3">
<input value={input}
onChange={(e)=>setInput(e.target.value)}
onKeyDown={(e)=>e.key==="Enter"&&sendMessage()}
className="flex-1 bg-transparent outline-none text-sm"
placeholder="Ask your knowledge base..."/>
<button onClick={sendMessage} className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white">
<Send size={18}/>
</button>
</div>
</div>
{/* ===== UNDO POPUP UI ===== */}
{lastDeleted && (
<div className="absolute bottom-20 left-1/2 -translate-x-1/2
bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg
flex flex-col gap-2 z-50 animate-fadeIn min-w-[260px]">

  <div className="flex justify-between items-center">
    <span className="text-sm">🗑️ Your deleted file moved to Trash</span>

    <button
      onClick={undoDelete}
      className="text-violet-400 hover:underline text-sm">
      Undo
    </button>
  </div>

  {/* ===== PROGRESS BAR ===== */}
  <div className="w-full h-[3px] bg-slate-700 rounded overflow-hidden">
    <div className="h-full bg-violet-500 animate-deleteTimer"/>
  </div>

</div>
)}



{/* ===== SETTINGS RESTORED ===== */}
{showSettings && (
<div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
<div className="bg-slate-900 p-6 rounded-xl w-[420px]">
<div className="flex justify-between mb-4">
<h2 className="font-semibold">Settings</h2>
<button onClick={()=>setShowSettings(false)}><X size={16}/></button>
</div>

<div className="flex gap-2 mb-4">
<button onClick={()=>setSettingsTab("history")}
className={`px-3 py-1 rounded ${settingsTab==="history"?"bg-violet-600":""}`}>
History
</button>

<button onClick={()=>setSettingsTab("fav")}
className={`px-3 py-1 rounded ${settingsTab==="fav"?"bg-violet-600":""}`}>
Favourites
</button>

<button onClick={()=>setSettingsTab("trash")}
className={`px-3 py-1 rounded ${settingsTab==="trash"?"bg-violet-600":""}`}>
Trash
</button>
</div>


{settingsTab==="history" && (
<div className="max-h-64 overflow-y-auto text-sm space-y-2">
{currentTab?.history.map((h,i)=>(
<div key={i}
onClick={()=>{
const el=messageRefs.current[`${h.tabId}-${h.msgIndex}`];
el?.scrollIntoView({behavior:"smooth"});
setShowSettings(false);
}}
className="opacity-70 cursor-pointer hover:text-white">
{h.text}
</div>
))}
</div>
)}

{settingsTab==="fav" && (
<div className="max-h-64 overflow-y-auto text-sm space-y-2">

{(JSON.parse(localStorage.getItem("favChats")||"[]")).length===0 && (
<div className="opacity-50">No favourites yet</div>
)}

{(JSON.parse(localStorage.getItem("favChats")||"[]")).map((f,i)=>(
<div
key={i}
className="flex justify-between items-center border-b border-slate-700 pb-2
hover:bg-slate-800/40 px-2 py-1 rounded transition-all duration-200 group"
>

<span className="opacity-80 group-hover:text-yellow-400 transition">
⭐ {f.title || `Favourite Chat ${i+1}`}
</span>

<div className="flex gap-3 opacity-60 group-hover:opacity-100 transition">

<button
onClick={()=>{
openFromSidebar(f.id);
setShowSettings(false);
}}
className="hover:text-violet-400">
Open
</button>

<button
onClick={()=>{
const old=JSON.parse(localStorage.getItem("favChats")||"[]");
const updated=old.filter((_,index)=>index!==i);
localStorage.setItem("favChats",JSON.stringify(updated));

// instant refresh
setSettingsTab("history");
setTimeout(()=>setSettingsTab("fav"),0);
}}
className="hover:text-red-400">
Delete
</button>

</div>

</div>
))}

</div>
)}



{settingsTab==="trash" && (
<div className="max-h-64 overflow-y-auto text-sm space-y-2">

{trashDocs.length===0 && (
<div className="opacity-50">Trash is empty</div>
)}

{trashDocs.map((doc,i)=>(
<div key={i} className="flex justify-between items-center border-b border-slate-700 pb-2">

<span>{doc}</span>

<div className="flex gap-3">

<button
onClick={async()=>{

  await fetch(`https://ai-based-document-search-rag.onrender.com/documents/undo/${doc}`,{
    method:"POST"
  });

  // reload from backend (REAL STATE)
  loadDocs();

  setTrashDocs(p=>p.filter(t=>t!==doc));
}}

className="text-violet-400 hover:underline">
Undo
</button>

<button
onClick={()=>{
  setTrashDocs(p=>p.filter(t=>t!==doc));
}}
className="text-red-400 hover:underline">
Delete
</button>

</div>

</div>
))}
</div>
)}


</div>
</div>
)}

</main>
</div>
);
}

