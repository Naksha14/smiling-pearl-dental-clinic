import { createClient } from "@/lib/supabase/server";

export async function hasPermission(
  module: string,
  action: "view" | "create" | "edit" | "delete"
) {

  const supabase = await createClient();


  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();



  if (!user) return false;



  // Doctor has full access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();



  if (profile?.role === "doctor") {
    return true;
  }



  const { data } = await supabase
    .from("user_permissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("module", module)
    .single();



  if (!data) return false;



  if (action === "view") return data.can_view;

  if (action === "create") return data.can_create;

  if (action === "edit") return data.can_edit;

  if (action === "delete") return data.can_delete;


  return false;

}