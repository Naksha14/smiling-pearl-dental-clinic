import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});

  const { data:profile } = await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(profile?.role !== "doctor") return NextResponse.json({error:"Doctor access only"},{status:403});

  const body=await req.json();
  const message=String(body.message||"").slice(0,6000);

  const key=process.env.OPENROUTER_API_KEY;
  const model=process.env.OPENROUTER_MODEL;
  if(!key || !model) return NextResponse.json({error:"OpenRouter is not configured on the server."},{status:500});

  const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${key}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      model,
      messages:[
        {role:"system",content:"You are a clinical documentation support assistant for a dental clinic. Provide general informational and documentation assistance. Do not make autonomous diagnoses, prescriptions, or emergency decisions. Encourage verification by the treating clinician."},
        {role:"user",content:message}
      ]
    })
  });

  if(!response.ok){
    return NextResponse.json({error:"Assistant provider request failed."},{status:502});
  }

  const data=await response.json();
  return NextResponse.json({answer:data?.choices?.[0]?.message?.content ?? "No answer returned."});
}
