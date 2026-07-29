"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function DashboardClient({
  profile,
  initialPatients,
  initialAppointments,
}: {
  profile: {
    full_name: string;
    username: string;
    role: string;
  };
  initialPatients: number;
  initialAppointments: number;
}) {
  const supabase = createClient();

  const [appointments, setAppointments] =
    useState(initialAppointments);

  const [newAppointment, setNewAppointment] =
    useState<Appointment | null>(null);

  const [showNewAppointment, setShowNewAppointment] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const isDoctor = profile.role === "doctor";

  const firstName =
    profile.full_name?.split(" ")[0] || "User";

  /* CLOCK */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* REALTIME APPOINTMENT */

  useEffect(() => {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

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
        console.error(error);
        return;
      }

      if (data) {
        setNewAppointment(
          data as unknown as Appointment
        );

        setShowNewAppointment(true);

        setTimeout(() => {
          setShowNewAppointment(false);
        }, 10000);
      }
    }

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
          const appointment =
            payload.new as Appointment;

          if (
            appointment.appointment_date === today
          ) {
            setAppointments(
              (previous) => previous + 1
            );
          }

          await loadNewAppointment(
            appointment.id
          );
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formattedDate =
    currentTime.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formattedTime =
    currentTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="dashboardPage">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className={
          isDoctor
            ? "dashboardHero doctorHero"
            : "dashboardHero receptionHero"
        }
      >

        <div className="dashboardHeroContent">

          <div className="dashboardWelcome">

            <div className="welcomeEyebrow">
              SMILING PEARL DENTAL CLINIC
            </div>

            <h1>
              Good day, {firstName} 👋
            </h1>

            <p>
              {isDoctor
                ? "Your clinical workspace is ready. Here’s your clinic overview for today."
                : "Your reception workspace is ready. Let’s keep today’s clinic running smoothly."}
            </p>

            <div className="dashboardRolePill">
              <span>
                {isDoctor ? "🩺" : "🧑‍💼"}
              </span>

              {isDoctor
                ? "Doctor Portal"
                : "Reception Portal"}
            </div>

          </div>


          <div className="dashboardClock">

            <div className="dashboardClockIcon">
              🕐
            </div>

            <div>
              <strong>
                {formattedTime}
              </strong>

              <span>
                {formattedDate}
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          NEW APPOINTMENT ALERT
      ===================================================== */}

      {showNewAppointment &&
        newAppointment && (

        <section className="newAppointmentAlert">

          <div className="newAppointmentIcon">
            🔔
          </div>

          <div className="newAppointmentContent">

            <div className="newAppointmentLabel">
              NEW APPOINTMENT
            </div>

            <h2>
              {newAppointment.patients
                ?.full_name ||
                "New Patient"}
            </h2>

            <div className="newAppointmentDetails">

              <span>
                🪪{" "}
                {newAppointment.patients
                  ?.patient_code || "-"}
              </span>

              <span>
                📅{" "}
                {newAppointment.appointment_date}
              </span>

              <span>
                🕐{" "}
                {newAppointment.appointment_time}
              </span>

              <span>
                📞{" "}
                {newAppointment.patients
                  ?.phone || "No phone"}
              </span>

            </div>

            <p>
              <strong>Reason:</strong>{" "}
              {newAppointment.reason ||
                "Not specified"}
            </p>

          </div>

          <button
            className="dashboardDismiss"
            onClick={() =>
              setShowNewAppointment(false)
            }
          >
            Dismiss
          </button>

        </section>
      )}


      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="dashboardStats">

        <div className="dashboardStatCard">

          <div className="statCardTop">

            <div className="statCardIcon patientsIcon">
              👥
            </div>

            <span className="statCardLabel">
              PATIENTS
            </span>

          </div>

          <div className="statCardNumber">
            {initialPatients}
          </div>

          <div className="statCardBottom">
            Registered patients
          </div>

        </div>


        <div className="dashboardStatCard">

          <div className="statCardTop">

            <div className="statCardIcon appointmentIcon">
              📅
            </div>

            <span className="statCardLabel">
              TODAY
            </span>

          </div>

          <div className="statCardNumber">
            {appointments}
          </div>

          <div className="statCardBottom">
            Appointments scheduled
          </div>

        </div>


        <div className="dashboardStatCard">

          <div className="statCardTop">

            <div className="statCardIcon roleIcon">
              {isDoctor ? "🦷" : "🧾"}
            </div>

            <span className="statCardLabel">
              WORKSPACE
            </span>

          </div>

          <div className="statCardRole">
            {isDoctor
              ? "Clinical"
              : "Reception"}
          </div>

          <div className="statCardBottom">
            {isDoctor
              ? "Doctor workspace"
              : "Front desk workspace"}
          </div>

        </div>


        <div className="dashboardStatCard">

          <div className="statCardTop">

            <div className="statCardIcon notificationIcon">
              🔔
            </div>

            <span className="statCardLabel">
              SYSTEM
            </span>

          </div>

          <div className="statCardRole onlineText">
            Online
          </div>

          <div className="statCardBottom">
            Live clinic system active
          </div>

        </div>

      </section>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="dashboardGrid">


        {/* LEFT */}

        <div className="dashboardPanel">

          <div className="dashboardPanelHeader">

            <div>

              <span className="panelEyebrow">
                {isDoctor
                  ? "CLINICAL WORKSPACE"
                  : "FRONT DESK"}
              </span>

              <h2>
                {isDoctor
                  ? "Doctor Actions"
                  : "Reception Actions"}
              </h2>

            </div>

            <span className="panelHeaderIcon">
              {isDoctor ? "🩺" : "🧑‍💼"}
            </span>

          </div>


          <div className="quickActions">


            {/* PATIENTS */}

            <Link
              href="/patients"
              className="quickAction"
            >

              <span className="quickActionIcon">
                👤
              </span>

              <span>
                <strong>
                  Patient Registration
                </strong>

                <small>
                  Register and manage patient records
                </small>
              </span>

              <span className="quickArrow">
                →
              </span>

            </Link>


            {/* APPOINTMENTS */}

            <Link
              href="/appointments"
              className="quickAction"
            >

              <span className="quickActionIcon">
                📅
              </span>

              <span>
                <strong>
                  Appointment Booking
                </strong>

                <small>
                  Schedule and manage appointments
                </small>
              </span>

              <span className="quickArrow">
                →
              </span>

            </Link>


            {isDoctor ? (

              <>
                {/* CASE PAPER */}

                <Link
                  href="/case-paper"
                  className="quickAction"
                >

                  <span className="quickActionIcon">
                    📋
                  </span>

                  <span>
                    <strong>
                      Clinical Case Papers
                    </strong>

                    <small>
                      Record and review clinical findings
                    </small>
                  </span>

                  <span className="quickArrow">
                    →
                  </span>

                </Link>


                {/* PRESCRIPTIONS */}

                <Link
                  href="/prescriptions"
                  className="quickAction"
                >

                  <span className="quickActionIcon">
                    💊
                  </span>

                  <span>
                    <strong>
                      Prescriptions
                    </strong>

                    <small>
                      Create and manage prescriptions
                    </small>
                  </span>

                  <span className="quickArrow">
                    →
                  </span>

                </Link>


                {/* PATIENT CALLING */}

                <Link
                  href="/patient-calling"
                  className="quickAction"
                >

                  <span className="quickActionIcon">
                    📢
                  </span>

                  <span>
                    <strong>
                      Patient Calling
                    </strong>

                    <small>
                      Call the next patient
                    </small>
                  </span>

                  <span className="quickArrow">
                    →
                  </span>

                </Link>

              </>

            ) : (

              <>

                {/* RECEPTION CALLING */}

                <Link
                  href="/reception-listener"
                  className="quickAction"
                >

                  <span className="quickActionIcon">
                    📢
                  </span>

                  <span>
                    <strong>
                      Reception Calling
                    </strong>

                    <small>
                      Hear and manage doctor patient calls
                    </small>
                  </span>

                  <span className="quickArrow">
                    →
                  </span>

                </Link>


                {/* NOTIFICATIONS */}

                <Link
                  href="/notifications"
                  className="quickAction"
                >

                  <span className="quickActionIcon">
                    🔔
                  </span>

                  <span>
                    <strong>
                      Notifications
                    </strong>

                    <small>
                      View important clinic alerts
                    </small>
                  </span>

                  <span className="quickArrow">
                    →
                  </span>

                </Link>

              </>

            )}

          </div>

        </div>


        {/* RIGHT */}

        <div className="dashboardPanel">

          <div className="dashboardPanelHeader">

            <div>

              <span className="panelEyebrow">
                TODAY&apos;S WORKSPACE
              </span>

              <h2>
                Clinic Status
              </h2>

            </div>

            <span className="statusOnline">
              ● Online
            </span>

          </div>


          <div className="clinicStatusList">


            <div className="clinicStatusItem">

              <div className="statusItemIcon">
                🦷
              </div>

              <div>
                <strong>
                  Smiling Pearl Clinic
                </strong>

                <span>
                  Management system operational
                </span>
              </div>

              <b>✓</b>

            </div>


            <div className="clinicStatusItem">

              <div className="statusItemIcon">
                📅
              </div>

              <div>
                <strong>
                  Appointment System
                </strong>

                <span>
                  {appointments} appointment
                  {appointments === 1
                    ? ""
                    : "s"} today
                </span>
              </div>

              <b>✓</b>

            </div>


            <div className="clinicStatusItem">

              <div className="statusItemIcon">
                🔔
              </div>

              <div>
                <strong>
                  Live Notifications
                </strong>

                <span>
                  Real-time alerts enabled
                </span>
              </div>

              <b>✓</b>

            </div>


            <div className="clinicStatusItem">

              <div className="statusItemIcon">
                🔐
              </div>

              <div>
                <strong>
                  Secure Session
                </strong>

                <span>
                  Signed in as {profile.username}
                </span>
              </div>

              <b>✓</b>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          BOTTOM INFORMATION
      ===================================================== */}

      <section className="dashboardBottomGrid">


        <div className="dashboardInfoCard">

          <div className="dashboardInfoIcon">
            {isDoctor ? "🦷" : "💙"}
          </div>

          <div>

            <span className="infoSmall">
              {isDoctor
                ? "CLINICAL CARE"
                : "PATIENT EXPERIENCE"}
            </span>

            <h3>
              {isDoctor
                ? "Focus on patient care."
                : "Keep every patient visit smooth."}
            </h3>

            <p>
              {isDoctor
                ? "Manage clinical records, prescriptions and patient communication from one workspace."
                : "Manage registrations, appointments, notifications and reception communication from one place."}
            </p>

          </div>

        </div>


        <div className="dashboardDateCard">

          <span>
            TODAY
          </span>

          <strong>
            {currentTime.toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
              }
            )}
          </strong>

          <small>
            {currentTime.toLocaleDateString(
              "en-IN",
              {
                weekday: "long",
              }
            )}
          </small>

        </div>

      </section>


      {/* FOOTER */}

      <div className="dashboardFooter">

        <div>

          <span className="footerTooth">
            🦷
          </span>

          <div>

            <strong>
              Smiling Pearl Dental Clinic
            </strong>

            <span>
              Digital Clinic Management System
            </span>

          </div>

        </div>

        <span>
          {isDoctor
            ? "Doctor Portal"
            : "Reception Portal"}
        </span>

      </div>

    </div>
  );
}