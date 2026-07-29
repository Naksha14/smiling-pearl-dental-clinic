import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "doctor" | "receptionist";

export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, active")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.active ||
    !["doctor", "receptionist"].includes(profile.role)
  ) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return {
    user,
    profile: profile as {
      id: string;
      full_name: string | null;
      username: string | null;
      role: UserRole;
      active: boolean;
    },
  };
}

export async function requireDoctor() {
  const { user, profile } = await getCurrentUserProfile();

  if (profile.role !== "doctor") {
    redirect("/dashboard");
  }

  return {
    user,
    profile,
  };
}

export async function requireReceptionistOrDoctor() {
  return getCurrentUserProfile();
}