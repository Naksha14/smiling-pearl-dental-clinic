"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

declare global { interface Window { puter:any; } }

export default function ReceptionVoiceListener(){
  useEffect(()=>{
    const supabase=createClient();
    const channel=supabase.channel("clinic:reception",{
      config:{broadcast:{ack:true}}
    });

    channel.on("broadcast",{event:"patient_call"},async({payload})=>{
      const text=payload?.message;
      if(!text || !window.puter?.ai?.txt2speech)return;

      try{
        const audio=await window.puter.ai.txt2speech(text,{
          provider:"aws-polly",
          language:payload.language_code || "en-US",
          engine:"neural"
        });
        await audio.play();
      }catch(err){
        console.error("TTS playback failed",err);
      }
    }).subscribe();

    return ()=>{supabase.removeChannel(channel);}
  },[]);

  return null;
}
