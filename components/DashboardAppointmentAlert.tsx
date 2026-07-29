"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AppointmentAlert = {
  patient_name: string;
  patient_code: string;
  phone?: string;
  appointment_date: string;
  appointment_time: string;
  reason?: string;
};

export default function DashboardAppointmentAlert() {
  const supabase = useMemo(() => createClient(), []);

  const [appointment, setAppointment] =
    useState<AppointmentAlert | null>(null);

  const [show, setShow] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(
      "clinic:appointments"
    );

    channel
      .on(
        "broadcast",
        {
          event: "new_appointment",
        },
        (payload) => {
          console.log(
            "📅 New appointment received:",
            payload
          );

          const data =
            payload.payload as AppointmentAlert;

          setAppointment(data);
          setShow(true);

          // Optional browser notification
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("New Appointment", {
              body: `${data.patient_name} - ${data.appointment_time}`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "📡 Dashboard appointment channel:",
          status
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (!show || !appointment) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: 20,
        border: "2px solid #2563eb",
        borderRadius: 12,
        padding: 20,
        background: "#eff6ff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 15,
        }}
      >
        <div>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            🔔 New Appointment
          </h2>

          <p>
            <strong>Patient:</strong>{" "}
            {appointment.patient_name}
          </p>

          <p>
            <strong>OPD:</strong>{" "}
            {appointment.patient_code}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {appointment.appointment_date}
          </p>

          <p>
            <strong>Time:</strong>{" "}
            {appointment.appointment_time}
          </p>

          {appointment.phone && (
            <p>
              <strong>Phone:</strong>{" "}
              {appointment.phone}
            </p>
          )}

          {appointment.reason && (
            <p>
              <strong>Reason:</strong>{" "}
              {appointment.reason}
            </p>
          )}
        </div>

        <button
          className="btn"
          onClick={() => setShow(false)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}