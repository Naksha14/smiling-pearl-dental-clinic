"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

const appointmentStatuses = [
  "Scheduled",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No-show",
];

export default function AppointmentsClient() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [patients, setPatients] =
    useState<any[]>([]);

  const [appointments, setAppointments] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [msg, setMsg] =
    useState("");

  const [role, setRole] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const [form, setForm] = useState({
    patient_id: "",
    appointment_date: today,
    appointment_time: "",
    reason: "",
  });


  /*
   * GET CURRENT USER ROLE
   */

  async function loadUserRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error) {
      console.log(
        "Role loading error:",
        error
      );
      return;
    }

    setRole(data?.role || "");
  }


  /*
   * LOAD PATIENTS + APPOINTMENTS
   */

  async function load() {
    const {
      data: patientsData,
      error: patientsError,
    } = await supabase
      .from("patients")
      .select(
        "id, full_name, patient_code, phone"
      )
      .is("deleted_at", null)
      .order("full_name");

    if (patientsError) {
      console.log(
        "Patient loading error:",
        patientsError
      );
    }


    let query = supabase
      .from("appointments")
      .select(`
        *,
        patients(
          full_name,
          patient_code,
          phone
        )
      `)
      .order(
        "appointment_date",
        {
          ascending: false,
        }
      )
      .order(
        "appointment_time",
        {
          ascending: true,
        }
      );


    if (search.trim()) {
      query = query.or(
        `reason.ilike.%${search.trim()}%`
      );
    }


    const {
      data: appointmentsData,
      error: appointmentsError,
    } = await query;


    if (appointmentsError) {
      console.log(
        "Appointment loading error:",
        appointmentsError
      );
    }


    setPatients(
      patientsData ?? []
    );

    setAppointments(
      appointmentsData ?? []
    );
  }


  /*
   * INITIAL LOAD
   */

  useEffect(() => {
    load();
    loadUserRole();
  }, [search]);


  /*
   * REALTIME NEW APPOINTMENT BROADCAST
   */

  async function sendNewAppointmentBroadcast(
    appointment: any
  ) {
    const patient =
      appointment.patients;


    const channel =
      supabase.channel(
        "clinic:appointments",
        {
          config: {
            broadcast: {
              ack: true,
            },
          },
        }
      );


    try {
      await new Promise<void>(
        (resolve, reject) => {
          const timeout =
            setTimeout(() => {
              reject(
                new Error(
                  "Appointment broadcast connection timed out."
                )
              );
            }, 5000);


          channel.subscribe(
            (status) => {
              console.log(
                "📡 Appointment channel status:",
                status
              );


              if (
                status ===
                "SUBSCRIBED"
              ) {
                clearTimeout(
                  timeout
                );

                resolve();
              }


              if (
                status ===
                  "CHANNEL_ERROR" ||
                status ===
                  "TIMED_OUT"
              ) {
                clearTimeout(
                  timeout
                );

                reject(
                  new Error(
                    "Could not connect to appointment channel."
                  )
                );
              }
            }
          );
        }
      );


      const result =
        await channel.send({
          type: "broadcast",
          event: "new_appointment",
          payload: {
            patient_name:
              patient?.full_name ||
              "Unknown Patient",

            patient_code:
              patient?.patient_code ||
              "-",

            phone:
              patient?.phone ||
              "",

            appointment_date:
              appointment.appointment_date,

            appointment_time:
              appointment.appointment_time,

            reason:
              appointment.reason ||
              "",
          },
        });


      console.log(
        "📅 New appointment broadcast result:",
        result
      );

    } catch (error) {
      console.log(
        "Appointment broadcast error:",
        error
      );

    } finally {
      await supabase
        .removeChannel(channel);
    }
  }


  /*
   * CREATE DOCTOR NOTIFICATIONS
   */

  async function createDoctorNotifications(
    appointment: any
  ) {
    const {
      data: doctors,
      error: doctorError,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "doctor");


    if (doctorError) {
      console.log(
        "Doctor lookup error:",
        doctorError
      );

      return;
    }


    if (
      !doctors ||
      doctors.length === 0
    ) {
      return;
    }


    const patient =
      appointment.patients;


    const rows =
      doctors.map(
        doctor => ({
          user_id:
            doctor.id,

          title:
            "New Appointment",

          message:
            `${patient?.full_name || "Patient"} has a new appointment on ${appointment.appointment_date} at ${appointment.appointment_time}.`,

          type:
            "appointment",

          is_read:
            false,
        })
      );


    const {
      error,
    } = await supabase
      .from("notifications")
      .insert(rows);


    if (error) {
      console.log(
        "Doctor notification error:",
        error
      );
    }
  }


  /*
   * ADD APPOINTMENT
   */

  async function add(
    e: FormEvent
  ) {
    e.preventDefault();

    setMsg("");


    if (!form.patient_id) {
      setMsg(
        "Please select a patient."
      );
      return;
    }


    if (!form.appointment_date) {
      setMsg(
        "Please select appointment date."
      );
      return;
    }


    if (!form.appointment_time) {
      setMsg(
        "Please select appointment time."
      );
      return;
    }


    const {
      data: newAppointment,
      error,
    } = await supabase
      .from("appointments")
      .insert({
        patient_id:
          Number(form.patient_id),

        appointment_date:
          form.appointment_date,

        appointment_time:
          form.appointment_time,

        reason:
          form.reason,

        status:
          "Scheduled",
      })
      .select(`
        *,
        patients(
          full_name,
          patient_code,
          phone
        )
      `)
      .single();


    if (error) {
      setMsg(
        error.message
      );
      return;
    }


    if (!newAppointment) {
      setMsg(
        "Appointment created, but details could not be loaded."
      );
      return;
    }


    /*
     * Notify doctors
     */

    await createDoctorNotifications(
      newAppointment
    );


    /*
     * Realtime dashboard alert
     */

    await sendNewAppointmentBroadcast(
      newAppointment
    );


    setMsg(
      "Appointment booked successfully."
    );


    setForm({
      patient_id: "",
      appointment_date: today,
      appointment_time: "",
      reason: "",
    });


    load();
  }


  /*
   * UPDATE STATUS
   */

  async function updateStatus(
    appointmentId: number,
    status: string
  ) {
    setMsg("");

    setUpdatingId(
      appointmentId
    );


    const {
      error,
    } = await supabase
      .from("appointments")
      .update({
        status,
      })
      .eq(
        "id",
        appointmentId
      );


    if (error) {
      console.log(
        "Appointment status update error:",
        error
      );

      setMsg(
        error.message
      );

      setUpdatingId(null);

      return;
    }


    setAppointments(
      previous =>
        previous.map(
          appointment =>
            appointment.id ===
            appointmentId
              ? {
                  ...appointment,
                  status,
                }
              : appointment
        )
    );


    setMsg(
      "Appointment status updated."
    );


    setUpdatingId(null);
  }


  /*
   * DELETE APPOINTMENT
   * DOCTOR ONLY
   */

  async function deleteAppointment(
    appointmentId: number,
    patientName: string
  ) {

    /*
     * Extra frontend protection
     */

    if (role !== "doctor") {
      setMsg(
        "Only doctors can delete appointments."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `Delete the appointment for ${patientName}?\n\nThis will permanently remove this appointment.`
      );


    if (!confirmed) {
      return;
    }


    setMsg("");

    setDeletingId(
      appointmentId
    );


    const {
      error,
    } = await supabase
      .from("appointments")
      .delete()
      .eq(
        "id",
        appointmentId
      );


    if (error) {
      console.log(
        "Appointment delete error:",
        error
      );

      setMsg(
        `Could not delete appointment: ${error.message}`
      );

      setDeletingId(null);

      return;
    }


    /*
     * Remove immediately from screen
     */

    setAppointments(
      previous =>
        previous.filter(
          appointment =>
            appointment.id !==
            appointmentId
        )
    );


    setMsg(
      "Appointment deleted successfully."
    );


    setDeletingId(null);
  }


  return (
    <div className="container">

      <h1>
        Appointment Booking
      </h1>


      {/* BOOK APPOINTMENT */}

      <div className="card">

        <h2>
          Book New Appointment
        </h2>


        <form
          onSubmit={add}
          className="grid grid2"
        >

          <div>

            <label>
              Patient *
            </label>

            <select
              required
              value={
                form.patient_id
              }
              onChange={e =>
                setForm({
                  ...form,
                  patient_id:
                    e.target.value,
                })
              }
            >

              <option value="">
                Select patient
              </option>


              {patients.map(
                p => (

                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.patient_code}
                    {" — "}
                    {p.full_name}
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label>
              Date *
            </label>

            <input
              type="date"
              required
              value={
                form.appointment_date
              }
              onChange={e =>
                setForm({
                  ...form,
                  appointment_date:
                    e.target.value,
                })
              }
            />

          </div>


          <div>

            <label>
              Time *
            </label>

            <input
              type="time"
              required
              value={
                form.appointment_time
              }
              onChange={e =>
                setForm({
                  ...form,
                  appointment_time:
                    e.target.value,
                })
              }
            />

          </div>


          <div>

            <label>
              Reason / Purpose
            </label>

            <input
              value={
                form.reason
              }
              placeholder="Enter reason for visit"
              onChange={e =>
                setForm({
                  ...form,
                  reason:
                    e.target.value,
                })
              }
            />

          </div>


          <div>

            <button
              className="btn"
              type="submit"
            >
              Book Appointment
            </button>

          </div>

        </form>


        {msg && (
          <p className="success">
            {msg}
          </p>
        )}

      </div>


      {/* SEARCH */}

      <div
        className="card"
        style={{
          marginTop: 20,
        }}
      >

        <h2>
          Appointment Search
        </h2>

        <input
          placeholder="Search appointment reason"
          value={search}
          onChange={e =>
            setSearch(
              e.target.value
            )
          }
        />

      </div>


      {/* APPOINTMENTS */}

      <div
        className="card"
        style={{
          marginTop: 20,
        }}
      >

        <h2>
          Appointments
        </h2>


        {appointments.length === 0 ? (

          <p className="muted">
            No appointments found.
          </p>

        ) : (

          <table>

            <thead>

              <tr>

                <th>
                  OPD
                </th>

                <th>
                  Patient
                </th>

                <th>
                  Phone
                </th>

                <th>
                  Date
                </th>

                <th>
                  Time
                </th>

                <th>
                  Reason
                </th>

                <th>
                  Status
                </th>

                {/* DOCTOR ONLY */}

                {role === "doctor" && (
                  <th>
                    Action
                  </th>
                )}

              </tr>

            </thead>


            <tbody>

              {appointments.map(
                a => (

                  <tr
                    key={a.id}
                  >

                    <td>
                      {
                        a.patients
                          ?.patient_code ||
                        "-"
                      }
                    </td>


                    <td>
                      {
                        a.patients
                          ?.full_name ||
                        "-"
                      }
                    </td>


                    <td>
                      {
                        a.patients
                          ?.phone ||
                        "-"
                      }
                    </td>


                    <td>
                      {
                        a.appointment_date
                      }
                    </td>


                    <td>
                      {
                        a.appointment_time
                      }
                    </td>


                    <td>
                      {
                        a.reason ||
                        "-"
                      }
                    </td>


                    <td>

                      <select
                        value={
                          a.status ||
                          "Scheduled"
                        }
                        disabled={
                          updatingId ===
                            a.id ||
                          deletingId ===
                            a.id
                        }
                        onChange={e =>
                          updateStatus(
                            a.id,
                            e.target.value
                          )
                        }
                      >

                        {appointmentStatuses.map(
                          status => (

                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>

                          )
                        )}

                      </select>

                    </td>


                    {/* DELETE — DOCTOR ONLY */}

                    {role === "doctor" && (

                      <td>

                        <button
                          type="button"
                          className="btn"
                          disabled={
                            deletingId ===
                              a.id ||
                            updatingId ===
                              a.id
                          }
                          onClick={() =>
                            deleteAppointment(
                              a.id,
                              a.patients
                                ?.full_name ||
                              "this patient"
                            )
                          }
                        >

                          {deletingId ===
                          a.id
                            ? "Deleting..."
                            : "🗑 Delete"}

                        </button>

                      </td>

                    )}

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}