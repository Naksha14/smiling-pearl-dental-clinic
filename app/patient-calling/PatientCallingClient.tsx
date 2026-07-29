"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const languageMap: Record<string, string> = {
  English: "en-US",
  Kannada: "kn-IN",
  Marathi: "mr-IN",
};

export default function PatientCallingClient() {

  const supabase = createClient();

  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState("");
  const [language, setLanguage] = useState("English");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    async function loadPatients() {

      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, patient_code")
        .is("deleted_at", null)
        .order("full_name");

      if (error) {
        console.error("Patient loading error:", error);
        setMsg(error.message);
        return;
      }

      setPatients(data ?? []);
    }

    loadPatients();

  }, []);


  async function callPatient() {

    setMsg("");
    setLoading(true);

    try {

      const patient = patients.find(
        p => String(p.id) === patientId
      );

      if (!patient) {
        setMsg("Select a patient.");
        return;
      }


      const {
        data: { user },
      } = await supabase.auth.getUser();


      if (!user) {
        setMsg("Doctor session not found.");
        return;
      }


      const text =
        message.trim() ||
        (
          language === "English"
            ? `Patient ${patient.full_name}, please proceed to the doctor's room.`
            : language === "Kannada"
              ? `ರೋಗಿ ${patient.full_name}, ದಯವಿಟ್ಟು ವೈದ್ಯರ ಕೊಠಡಿಗೆ ಬನ್ನಿ.`
              : `रुग्ण ${patient.full_name}, कृपया डॉक्टरांच्या खोलीत या.`
        );


      /*
       * 1. Save patient call event
       */

      const { error: callError } = await supabase
        .from("patient_call_events")
        .insert({
          patient_id: patient.id,
          doctor_id: user.id,
          language: language,
          voice_gender: "Female",
          message: text,
          status: "pending",
        });


      if (callError) {
        console.error(
          "Patient call error:",
          callError
        );

        setMsg(callError.message);
        return;
      }


      /*
       * 2. Find receptionists
       */

      const {
        data: receptionists,
        error: receptionistError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "receptionist");


      if (receptionistError) {
        console.error(
          "Receptionist lookup error:",
          receptionistError
        );
      }


      /*
       * 3. Create notification
       */

      if (
        receptionists &&
        receptionists.length > 0
      ) {

        const notificationRows =
          receptionists.map(
            receptionist => ({
              user_id: receptionist.id,
              title: "Patient Calling",
              message: text,
              type: "patient_call",
              is_read: false,
            })
          );


        const {
          error: notificationError,
        } = await supabase
          .from("notifications")
          .insert(notificationRows);


        if (notificationError) {

          console.error(
            "Notification error:",
            notificationError
          );

          setMsg(
            `Patient call saved, but notification failed: ${notificationError.message}`
          );

          return;
        }
      }


      /*
       * 4. Create realtime channel
       */

      const channel = supabase.channel(
        "clinic:reception",
        {
          config: {
            broadcast: {
              ack: true,
            },
          },
        }
      );


      /*
       * 5. Connect to reception channel
       */

      await new Promise<void>(
        (resolve, reject) => {

          let finished = false;


          const timeout =
            setTimeout(() => {

              if (!finished) {

                finished = true;

                reject(
                  new Error(
                    "Reception channel connection timed out."
                  )
                );
              }

            }, 5000);


          channel.subscribe(status => {

            console.log(
              "Doctor channel status:",
              status
            );


            if (
              status === "SUBSCRIBED" &&
              !finished
            ) {

              finished = true;

              clearTimeout(timeout);

              resolve();
            }


            if (
              (
                status === "CHANNEL_ERROR" ||
                status === "TIMED_OUT"
              ) &&
              !finished
            ) {

              finished = true;

              clearTimeout(timeout);

              reject(
                new Error(
                  "Could not connect to reception."
                )
              );
            }

          });

        }
      );


      /*
       * 6. Send realtime announcement
       */

      const result =
        await channel.send({

          type: "broadcast",

          event: "patient_call",

          payload: {

            message: text,

            language_code:
              languageMap[language],

            patient_id:
              patient.id,

            patient_name:
              patient.full_name,

            language:
              language,

          },

        });


      console.log(
        "Broadcast result:",
        result
      );


      /*
       * 7. Remove doctor channel
       */

      await supabase.removeChannel(
        channel
      );


      setMsg(
        "Announcement sent to reception and notification created."
      );


      /*
       * Clear custom message
       */

      setMessage("");


    } catch (error: any) {

      console.error(
        "Patient calling error:",
        error
      );


      setMsg(
        error?.message ||
        "Patient call failed."
      );

    } finally {

      setLoading(false);

    }

  }


  return (

    <div className="container">

      <h1>
        Patient Calling
      </h1>


      <div className="card">


        <label>
          Patient
        </label>


        <select

          value={patientId}

          onChange={e =>
            setPatientId(
              e.target.value
            )
          }

        >

          <option value="">
            Select patient
          </option>


          {patients.map(
            patient => (

              <option
                key={patient.id}
                value={patient.id}
              >

                {patient.patient_code}
                {" — "}
                {patient.full_name}

              </option>

            )
          )}

        </select>



        <label>
          Language
        </label>


        <select

          value={language}

          onChange={e =>
            setLanguage(
              e.target.value
            )
          }

        >

          <option value="English">
            English
          </option>

          <option value="Kannada">
            Kannada
          </option>

          <option value="Marathi">
            Marathi
          </option>

        </select>



        <label>
          Custom message (optional)
        </label>


        <textarea

          value={message}

          onChange={e =>
            setMessage(
              e.target.value
            )
          }

          placeholder="Enter custom announcement if required"

        />



        <button

          className="btn"

          type="button"

          disabled={loading}

          onClick={callPatient}

        >

          {loading
            ? "Calling..."
            : "🔊 Call Patient"
          }

        </button>



        {msg && (

          <p className="success">
            {msg}
          </p>

        )}


        <p className="muted">

          The receptionist must keep
          Reception Patient Calling open
          to receive the live announcement.

        </p>


      </div>

    </div>

  );

}