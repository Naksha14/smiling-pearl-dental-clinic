"use client";

import { useState } from "react";

  export default function AssistantClient(){
  const [q,setQ]=useState("");
  const [answer,setAnswer]=useState("");
  const [busy,setBusy]=useState(false);

  async function ask(){
    if(!q.trim())return;
    setBusy(true);setAnswer("");
    const res=await fetch("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q})});
    const data=await res.json();
    setAnswer(data.answer||data.error||"No response");
    setBusy(false);
  }

  return <div className="container">
    <h1>Doctor Assistant</h1>
    <div className="card">
      <p className="muted">Support tool only. Verify clinical information independently and make final decisions as the treating professional.</p>
      <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask for documentation support, record summarization, or general information..." />
      <button className="btn" onClick={ask} disabled={busy}>{busy?"Thinking...":"Ask Assistant"}</button>
      {answer&&<div className="card" style={{marginTop:16,whiteSpace:"pre-wrap"}}>{answer}</div>}
    </div>
  </div>
}
