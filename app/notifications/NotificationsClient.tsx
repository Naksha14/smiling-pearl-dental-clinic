"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsPage(){
  const supabase=createClient();
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return;
    const {data}=await supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
    setItems(data??[]);
  })()},[]);
  return <div className="container"><h1>Notifications</h1><div className="grid">{items.length?items.map(n=><div className="card" key={n.id}><strong>{n.title}</strong><p>{n.message}</p><small className="muted">{new Date(n.created_at).toLocaleString()}</small></div>):<div className="card">No notifications yet.</div>}</div></div>
}
