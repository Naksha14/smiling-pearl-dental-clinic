"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Patient = {
  id: number;
  patient_code: string | null;
  opd_no: string | null;
  full_name: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  phone: string | null;
  address: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_history: string | null;
};

type CasePaper = {
  id: number;
  patient_id: number;
  doctor_id: string | null;
  visit_date: string;
  reason: string | null;
  narrative: string | null;
  oe: string | null;
  adv_investigation: string | null;
  investigation: string | null;
  final_diagnosis: string | null;
  rx_advised: string | null;
  created_at: string;
};

export default function CasePaperClient() {
  const supabase = createClient();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [casePapers, setCasePapers] =
    useState<CasePaper[]>([]);

  const [selectedCasePaper, setSelectedCasePaper] =
    useState<CasePaper | null>(null);

  const [loadingPatients, setLoadingPatients] =
    useState(true);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    visit_date: new Date().toISOString().slice(0, 10),
    reason: "",
    narrative: "",
    oe: "",
    adv_investigation: "",
    investigation: "",
    final_diagnosis: "",
    rx_advised: "",
  });

  /*
   * LOAD PATIENTS
   */

  useEffect(() => {
    async function loadPatients() {
      setLoadingPatients(true);

      const { data, error } = await supabase
        .from("patients")
        .select(`
          id,
          patient_code,
          opd_no,
          full_name,
          age,
          gender,
          occupation,
          phone,
          address,
          blood_group,
          allergies,
          medical_history
        `)
        .is("deleted_at", null)
        .order("full_name");

      if (error) {
        console.log(
          "Patient loading error:",
          error
        );

        setMsg(error.message);
      }

      setPatients(data ?? []);
      setLoadingPatients(false);
    }

    loadPatients();
  }, []);

  /*
   * LOAD CASE PAPER HISTORY
   */

  async function loadCasePaperHistory(
    selectedPatientId: number
  ) {
    setLoadingHistory(true);
    setSelectedCasePaper(null);

    const { data, error } = await supabase
      .from("case_papers")
      .select(`
        id,
        patient_id,
        doctor_id,
        visit_date,
        reason,
        narrative,
        oe,
        adv_investigation,
        investigation,
        final_diagnosis,
        rx_advised,
        created_at
      `)
      .eq("patient_id", selectedPatientId)
      .is("deleted_at", null)
      .order("visit_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.log(
        "Case paper history error:",
        error
      );

      setMsg(error.message);
      setCasePapers([]);
      setLoadingHistory(false);

      return;
    }

    setCasePapers(data ?? []);
    setLoadingHistory(false);
  }

  /*
   * SELECT PATIENT
   */

  function handlePatientChange(
    value: string
  ) {
    setPatientId(value);
    setMsg("");
    setSelectedCasePaper(null);

    const patient =
      patients.find(
        p => p.id === Number(value)
      ) ?? null;

    setSelectedPatient(patient);

    if (patient) {
      loadCasePaperHistory(patient.id);
    } else {
      setCasePapers([]);
    }

    /*
     * Reset form for new case paper
     */

    setForm({
      visit_date:
        new Date()
          .toISOString()
          .slice(0, 10),

      reason: "",
      narrative: "",
      oe: "",
      adv_investigation: "",
      investigation: "",
      final_diagnosis: "",
      rx_advised: "",
    });
  }

  /*
   * SAVE CASE PAPER
   */

  async function save(e: FormEvent) {
    e.preventDefault();

    setMsg("");

    if (!patientId) {
      setMsg("Please select a patient.");
      return;
    }

    if (!form.visit_date) {
      setMsg("Please select visit date.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("Doctor session not found.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("case_papers")
      .insert({
        patient_id: Number(patientId),
        doctor_id: user.id,
        visit_date: form.visit_date,
        reason: form.reason || null,
        narrative: form.narrative || null,
        oe: form.oe || null,
        adv_investigation:
          form.adv_investigation || null,
        investigation:
          form.investigation || null,
        final_diagnosis:
          form.final_diagnosis || null,
        rx_advised:
          form.rx_advised || null,
      });

    if (error) {
      console.log(
        "Case paper save error:",
        error
      );

      setMsg(error.message);
      setSaving(false);

      return;
    }

    setMsg(
      "Case paper saved successfully."
    );

    setForm({
      visit_date:
        new Date()
          .toISOString()
          .slice(0, 10),

      reason: "",
      narrative: "",
      oe: "",
      adv_investigation: "",
      investigation: "",
      final_diagnosis: "",
      rx_advised: "",
    });

    await loadCasePaperHistory(
      Number(patientId)
    );

    setSaving(false);
  }

  /*
   * DELETE CASE PAPER
   *
   * Soft delete:
   * deleted_at = current timestamp
   */

  async function deleteCasePaper(
    casePaperId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this case paper?"
    );

    if (!confirmed) {
      return;
    }

    setMsg("");
    setDeletingId(casePaperId);

    const { error } = await supabase
      .from("case_papers")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", casePaperId);

    if (error) {
      console.log(
        "Case paper delete error:",
        error
      );

      setMsg(
        `Unable to delete case paper: ${error.message}`
      );

      setDeletingId(null);

      return;
    }

    /*
     * Close the opened case paper
     * if the deleted one was being viewed.
     */

    if (
      selectedCasePaper?.id ===
      casePaperId
    ) {
      setSelectedCasePaper(null);
    }

    /*
     * Remove it immediately from the screen.
     */

    setCasePapers(prev =>
      prev.filter(
        casePaper =>
          casePaper.id !== casePaperId
      )
    );

    setMsg(
      "Case paper deleted successfully."
    );

    setDeletingId(null);
  }

  /*
   * OPEN PREVIOUS CASE PAPER
   */

  function openCasePaper(
    casePaper: CasePaper
  ) {
    setSelectedCasePaper(casePaper);
  }

  /*
   * CLOSE PREVIOUS CASE PAPER
   */

  function closeCasePaper() {
    setSelectedCasePaper(null);
  }

  /*
   * PRINT
   */

  function printCasePaper() {
    window.print();
  }

  return (
    <div className="container">

      {/* HEADER */}

      <div
        className="space"
        style={{
          alignItems: "center",
        }}
      >

        <div>

          <h1>
            Case Paper
          </h1>

          <p className="muted">
            Clinical examination and treatment
            record
          </p>

        </div>

        <button
          className="btn secondary"
          type="button"
          onClick={printCasePaper}
        >
          🖨️ Print
        </button>

      </div>


      {/* PATIENT SELECTION */}

      <div className="card">

        <h2>
          Select Patient
        </h2>

        <label>
          Patient *
        </label>

        <select
          value={patientId}
          onChange={e =>
            handlePatientChange(
              e.target.value
            )
          }
          disabled={loadingPatients}
        >

          <option value="">
            {loadingPatients
              ? "Loading patients..."
              : "Select patient"}
          </option>

          {patients.map(patient => (

            <option
              key={patient.id}
              value={patient.id}
            >

              {patient.patient_code ||
                patient.opd_no ||
                "-"}{" "}
              —{" "}
              {patient.full_name}

            </option>

          ))}

        </select>

      </div>


      {/* PATIENT DETAILS */}

      {selectedPatient && (

        <div
          className="card"
          style={{
            marginTop: 20,
          }}
        >

          <h2>
            Patient Details
          </h2>

          <div className="grid grid2">

            <div>

              <p>
                <strong>Name:</strong>{" "}
                {selectedPatient.full_name}
              </p>

              <p>
                <strong>OPD No:</strong>{" "}
                {selectedPatient.opd_no ||
                  selectedPatient.patient_code ||
                  "-"}
              </p>

              <p>
                <strong>Age:</strong>{" "}
                {selectedPatient.age ?? "-"}
              </p>

              <p>
                <strong>Gender:</strong>{" "}
                {selectedPatient.gender ||
                  "-"}
              </p>

            </div>


            <div>

              <p>
                <strong>Occupation:</strong>{" "}
                {selectedPatient.occupation ||
                  "-"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {selectedPatient.phone ||
                  "-"}
              </p>

              <p>
                <strong>Blood Group:</strong>{" "}
                {selectedPatient.blood_group ||
                  "-"}
              </p>

            </div>

          </div>


          <p>
            <strong>Address:</strong>{" "}
            {selectedPatient.address ||
              "-"}
          </p>


          <p>
            <strong>Allergies:</strong>{" "}
            {selectedPatient.allergies ||
              "-"}
          </p>


          <p>
            <strong>Medical History:</strong>{" "}
            {selectedPatient.medical_history ||
              "-"}
          </p>

        </div>

      )}


      {/* PREVIOUS CASE PAPERS */}

      {selectedPatient && (

        <div
          className="card"
          style={{
            marginTop: 20,
          }}
        >

          <h2>
            Previous Case Papers
          </h2>


          {loadingHistory ? (

            <p className="muted">
              Loading case paper history...
            </p>

          ) : casePapers.length === 0 ? (

            <p className="muted">
              No previous case papers found
              for this patient.
            </p>

          ) : (

            <table>

              <thead>

                <tr>

                  <th>
                    Visit Date
                  </th>

                  <th>
                    Diagnosis
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {casePapers.map(
                  casePaper => (

                    <tr
                      key={casePaper.id}
                    >

                      <td>
                        {casePaper.visit_date}
                      </td>


                      <td>
                        {
                          casePaper.final_diagnosis ||
                          "-"
                        }
                      </td>


                      <td>
                        {
                          casePaper.reason ||
                          "-"
                        }
                      </td>


                      <td>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap:
                              "wrap",
                          }}
                        >

                          <button
                            className="btn"
                            type="button"
                            onClick={() =>
                              openCasePaper(
                                casePaper
                              )
                            }
                          >
                            View
                          </button>


                          <button
                            className="btn secondary"
                            type="button"
                            disabled={
                              deletingId ===
                              casePaper.id
                            }
                            onClick={() =>
                              deleteCasePaper(
                                casePaper.id
                              )
                            }
                          >

                            {deletingId ===
                            casePaper.id
                              ? "Deleting..."
                              : "Delete"}

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      )}


      {/* PREVIOUS CASE PAPER VIEW */}

      {selectedCasePaper && (

        <div
          className="card"
          style={{
            marginTop: 20,
          }}
        >

          <div
            className="space"
            style={{
              alignItems: "center",
            }}
          >

            <h2>
              Previous Case Paper
            </h2>

            <button
              className="btn secondary"
              type="button"
              onClick={closeCasePaper}
            >
              Close
            </button>

          </div>


          <p>
            <strong>
              Visit Date:
            </strong>{" "}
            {selectedCasePaper.visit_date}
          </p>


          <hr />


          <h3>
            Patient Narrative / Chief Complaint
          </h3>

          <p className="muted">
            {selectedCasePaper.reason ||
              "Not added"}
          </p>


          <h3>
            Narrative
          </h3>

          <p className="muted">
            {selectedCasePaper.narrative ||
              "Not added"}
          </p>


          <h3>
            O/E
          </h3>

          <p className="muted">
            {selectedCasePaper.oe ||
              "Not added"}
          </p>


          <h3>
            Adv Investigation
          </h3>

          <p className="muted">
            {
              selectedCasePaper
                .adv_investigation ||
              "Not added"
            }
          </p>


          <h3>
            Investigation
          </h3>

          <p className="muted">
            {
              selectedCasePaper
                .investigation ||
              "Not added"
            }
          </p>


          <h3>
            Final Diagnosis
          </h3>

          <p className="muted">
            {
              selectedCasePaper
                .final_diagnosis ||
              "Not added"
            }
          </p>


          <h3>
            Rx Advised
          </h3>

          <p className="muted">
            {
              selectedCasePaper
                .rx_advised ||
              "Not added"
            }
          </p>

        </div>

      )}


      {/* NEW CASE PAPER */}

      {selectedPatient && (

        <div
          className="card"
          style={{
            marginTop: 20,
          }}
        >

          <h2>
            New Case Paper
          </h2>


          <form onSubmit={save}>

            <label>
              Visit Date *
            </label>

            <input
              type="date"
              required
              value={form.visit_date}
              onChange={e =>
                setForm({
                  ...form,
                  visit_date:
                    e.target.value,
                })
              }
            />


            <label>
              Patient Narrative / Chief Complaint
            </label>

            <textarea
              value={form.reason}
              placeholder="Enter patient's chief complaint or reason for visit"
              onChange={e =>
                setForm({
                  ...form,
                  reason:
                    e.target.value,
                })
              }
            />


            <label>
              Narrative
            </label>

            <textarea
              value={form.narrative}
              placeholder="Enter detailed patient narrative"
              onChange={e =>
                setForm({
                  ...form,
                  narrative:
                    e.target.value,
                })
              }
            />


            <label>
              O/E — On Examination
            </label>

            <textarea
              value={form.oe}
              placeholder="Enter examination findings"
              onChange={e =>
                setForm({
                  ...form,
                  oe: e.target.value,
                })
              }
            />


            <label>
              Adv Investigation
            </label>

            <textarea
              value={
                form.adv_investigation
              }
              placeholder="Enter advised investigations"
              onChange={e =>
                setForm({
                  ...form,
                  adv_investigation:
                    e.target.value,
                })
              }
            />


            <label>
              Investigation
            </label>

            <textarea
              value={
                form.investigation
              }
              placeholder="Enter investigation results"
              onChange={e =>
                setForm({
                  ...form,
                  investigation:
                    e.target.value,
                })
              }
            />


            <label>
              Final Diagnosis
            </label>

            <textarea
              value={
                form.final_diagnosis
              }
              placeholder="Enter final diagnosis"
              onChange={e =>
                setForm({
                  ...form,
                  final_diagnosis:
                    e.target.value,
                })
              }
            />


            <label>
              Rx Advised
            </label>

            <textarea
              value={
                form.rx_advised
              }
              placeholder="Enter treatment / prescription advised"
              onChange={e =>
                setForm({
                  ...form,
                  rx_advised:
                    e.target.value,
                })
              }
            />


            <button
              className="btn"
              type="submit"
              disabled={saving}
              style={{
                marginTop: 20,
              }}
            >

              {saving
                ? "Saving..."
                : "Save Case Paper"}

            </button>

          </form>


          {msg && (

            <p
              className={
                msg.includes(
                  "successfully"
                )
                  ? "success"
                  : ""
              }
              style={{
                marginTop: 15,
              }}
            >
              {msg}
            </p>

          )}

        </div>

      )}

    </div>
  );
}