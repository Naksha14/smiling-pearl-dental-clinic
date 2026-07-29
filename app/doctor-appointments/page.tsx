"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DoctorAppointmentsPage() {

  const supabase = createClient();

  const [appointments, setAppointments] = useState<any[]>([]);


  async function loadAppointments() {

    const today = new Date()
      .toISOString()
      .slice(0,10);


    const { data } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        reason,
        status,
        patients(
          id,
          full_name,
          patient_code
        )
      `)
      .eq("appointment_date", today)
      .order("appointment_time");


    setAppointments(data ?? []);

  }



  useEffect(()=>{

    loadAppointments();

  },[]);



  async function updateStatus(id:number,status:string){

    await supabase
      .from("appointments")
      .update({status})
      .eq("id",id);


    loadAppointments();

  }




  return (

    <div className="container">

      <h1>Today's Appointments</h1>


      <div className="card">

        <table>

          <thead>

            <tr>
              <th>Time</th>
              <th>OPD</th>
              <th>Patient</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>


          <tbody>

          {appointments.map((a)=>(

            <tr key={a.id}>

              <td>{a.appointment_time}</td>

              <td>
                {a.patients?.patient_code}
              </td>


              <td>
                {a.patients?.full_name}
              </td>


              <td>
                {a.reason || "-"}
              </td>


              <td>
                {a.status}
              </td>


              <td>

                {a.status !== "Confirmed" &&
                <button
                  className="btn"
                  onClick={()=>updateStatus(a.id,"Confirmed")}
                >
                  Confirm
                </button>
                }


                {a.status !== "Completed" &&
                <button
                  className="btn"
                  style={{marginLeft:8}}
                  onClick={()=>updateStatus(a.id,"Completed")}
                >
                  Complete
                </button>
                }


              </td>


            </tr>

          ))}


          </tbody>


        </table>


      </div>


    </div>

  );

}