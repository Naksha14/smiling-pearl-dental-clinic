"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function InventoryPage() {
  const supabase = createClient();
  const [items,setItems] = useState<any[]>([]);
  const [form,setForm] = useState({item_name:"",category:"",quantity:"0",minimum_stock:"0",unit:""});
  const [msg,setMsg] = useState("");

  async function load() {
    const {data}=await supabase.from("inventory").select("*").order("item_name");
    setItems(data??[]);
  }
  useEffect(()=>{load()},[]);

  async function add(e:FormEvent){
    e.preventDefault();
    const {error}=await supabase.from("inventory").insert({
      item_name:form.item_name, category:form.category,
      quantity:Number(form.quantity), minimum_stock:Number(form.minimum_stock), unit:form.unit
    });
    setMsg(error?error.message:"Inventory item added.");
    if(!error){setForm({item_name:"",category:"",quantity:"0",minimum_stock:"0",unit:""});load();}
  }

  return <div className="container">
    <h1>Inventory Management</h1>
    <div className="card">
      <form onSubmit={add} className="grid grid2">
        <div><label>Item</label><input required value={form.item_name} onChange={e=>setForm({...form,item_name:e.target.value})}/></div>
        <div><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></div>
        <div><label>Quantity</label><input type="number" min="0" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div>
        <div><label>Minimum stock</label><input type="number" min="0" value={form.minimum_stock} onChange={e=>setForm({...form,minimum_stock:e.target.value})}/></div>
        <div><label>Unit</label><input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></div>
        <button className="btn">Save Item</button>
      </form>
      {msg&&<p className="success">{msg}</p>}
    </div>
    <div className="card" style={{marginTop:20}}>
      <table><thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Minimum</th><th>Status</th></tr></thead>
      <tbody>{items.map(i=><tr key={i.id}><td>{i.item_name}</td><td>{i.category}</td><td>{i.quantity}</td><td>{i.minimum_stock}</td><td>{i.quantity<=i.minimum_stock?"⚠️ Low":"OK"}</td></tr>)}</tbody></table>
    </div>
  </div>
}
