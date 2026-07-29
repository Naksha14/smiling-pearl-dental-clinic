"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Appointment = {
  id: number;
  patient_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string | null;
  patients?: {
    full_name: string;
    patient_code: string;
    phone: string | null;
  } | null;
};

type DashboardClientProps = {
  profile: {
    full_name: string;
    username: string;
    role: string;
  };
  initialPatients: number;
  initialAppointments: number;
};

export default function DashboardClient({
  profile,
  initialPatients,
  initialAppointments,
}: DashboardClientProps) {

  const supabase = createClient();

  const [patients, setPatients] =
    useState<number>(initialPatients);

  const [appointments, setAppointments] =
    useState<number>(initialAppointments);

  const [newAppointment, setNewAppointment] =
    useState<Appointment | null>(null);

  const [showNewAppointment, setShowNewAppointment] =
    useState(false);

  const [notificationSound, setNotificationSound] =
    useState(false);


  /*
   * Load complete appointment information
   */

  async function loadNewAppointment(
    appointmentId: number
  ) {

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_id,
        appointment_date,
        appointment_time,
        reason,
        status,
        patients(
          full_name,
          patient_code,
          phone
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (error) {

      console.log(
        "New appointment loading error:",
        error
      );

      return;
    }

    if (data) {

      const appointment =
        data as unknown as Appointment;

      setNewAppointment(appointment);

      setShowNewAppointment(true);

      setNotificationSound(true);

      setTimeout(() => {
        setNotificationSound(false);
      }, 1000);

    }
  }


  /*
   * REALTIME APPOINTMENT LISTENER
   */

  useEffect(() => {

    const channel = supabase
      .channel("dashboard-appointments")

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
        },
        async (payload) => {

          console.log(
            "🔔 NEW APPOINTMENT RECEIVED:",
            payload
          );

          const appointment =
            payload.new as Appointment;


          /*
           * Update today's appointment count
           */

          const today =
            new Date()
              .toISOString()
              .slice(0, 10);

          if (
            appointment.appointment_date === today
          ) {

            setAppointments(
              previous => previous + 1
            );

          }


          /*
           * Load appointment details
           */

          await loadNewAppointment(
            appointment.id
          );

        }
      )

      .subscribe((status) => {

        console.log(
          "📡 Dashboard appointment realtime:",
          status
        );

      });


    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);


  return (

    <div className="container">

      <h1>
        Welcome back
      </h1>


      {/* =====================================
          NEW APPOINTMENT ALERT
      ====================================== */}

      {showNewAppointment &&
        newAppointment && (

        <div
          className="card"
          style={{
            marginBottom: 20,
            border: "2px solid #22c55e",
            background: "#f0fdf4",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
            }}
          >

            <div>

              <h2
                style={{
                  marginTop: 0,
                }}
              >
                🔔 NEW APPOINTMENT
              </h2>


              <p
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {
                  newAppointment.patients
                    ?.full_name ||
                  "New Patient"
                }
              </p>


              <p>

                OPD:{" "}

                <strong>
                  {
                    newAppointment.patients
                      ?.patient_code ||
                    "-"
                  }
                </strong>

              </p>


              <p>

                📅{" "}

                {
                  newAppointment
                    .appointment_date
                }

                {"   "}

                ⏰{" "}

                {
                  newAppointment
                    .appointment_time
                }

              </p>


              <p>

                Reason:{" "}

                {
                  newAppointment.reason ||
                  "Not specified"
                }

              </p>


              <p>

                Status:{" "}

                <strong>
                  {
                    newAppointment.status ||
                    "Scheduled"
                  }
                </strong>

              </p>

            </div>


            <button
              className="btn"
              onClick={() =>
                setShowNewAppointment(false)
              }
            >
              Dismiss
            </button>

          </div>

        </div>

      )}


      {/* =====================================
          DASHBOARD CARDS
      ====================================== */}

      <div className="grid grid4">


        {/* PATIENTS */}

        <div className="card">

          <div className="muted">
            Patients
          </div>

          <div className="stat">
            {patients}
          </div>

        </div>


        {/* TODAY'S APPOINTMENTS */}

        <div className="card">

          <div className="muted">
            Today's Appointments
          </div>

          <div className="stat">
            {appointments}
          </div>

        </div>


        {/* ROLE */}

        <div className="card">

          <div className="muted">
            Role
          </div>

          <div
            className="stat"
            style={{
              fontSize: 22,
            }}
          >
            {profile.role}
          </div>

        </div>


        {/* NOTIFICATIONS */}

        <div className="card">

          <div className="muted">
            Notifications
          </div>

          <div className="stat">
            🔔
          </div>

        </div>

      </div>

    </div>

  );
}