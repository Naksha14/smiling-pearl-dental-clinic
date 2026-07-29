import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requirePermission(
  module: string
) {

  const supabase = await createClient();


  const {
    data:{
      user
    }
  } = await supabase.auth.getUser();


  if(!user){
    redirect("/login");
  }



  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();



  // Doctor has complete access
  if(profile?.role === "doctor"){
    return profile;
  }



  const { data } = await supabase
    .from("user_permissions")
    .select("can_view")
    .eq("user_id", user.id)
    .eq("module", module)
    .single();



  if(!data?.can_view){

    redirect("/dashboard");

  }



  return profile;

}