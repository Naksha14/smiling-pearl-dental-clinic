import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import Sidebar from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";

import DashboardClient from "@/components/DashboardClient";


export default async function DashboardPage() {

  const supabase = await createClient();


  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();


  if (!user) {
    redirect("/login");
  }



  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, role")
    .eq("id", user.id)
    .single();


  if (!profile) {
    redirect("/login");
  }



  // Today's date
  const today =
    new Date().toISOString().slice(0, 10);



  // Get dashboard counts
  const [
    { count: patients },
    { count: appointments },
  ] = await Promise.all([

    supabase
      .from("patients")
      .select("*", {
        count: "exact",
        head: true,
      })
      .is("deleted_at", null),


    supabase
      .from("appointments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "appointment_date",
        today
      ),

  ]);



  return (

    <div className="appShell">

      {/* SIDEBAR */}

      <Sidebar
        role={profile.role}
      />


      <main>

        {/* TOPBAR */}

        <div className="topbar">

          <div className="space">

            <strong>
              Dashboard
            </strong>


            <span>
              {profile.full_name}
              {" · "}
              {profile.role}
            </span>


            <LogoutButton />

          </div>

        </div>



        {/* CLIENT DASHBOARD */}

        <DashboardClient

          profile={{
            full_name:
              profile.full_name,

            username:
              profile.username,

            role:
              profile.role,
          }}

          initialPatients={
            patients ?? 0
          }

          initialAppointments={
            appointments ?? 0
          }

        />

      </main>

    </div>

  );

}