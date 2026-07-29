"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function EditPatientClient() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadPatient() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      setMsg(error?.message || "Patient not found.");
      setLoading(false);
      return;
    }

    setForm(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPatient();
  }, [id]);

  async function save() {
    setMsg("");
    setSaving(true);

    const { error } = await supabase
      .from("patients")
      .update({
        full_name: form.full_name,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        occupation: form.occupation,
        address: form.address,
        phone: form.phone,
        email: form.email || null,
        dob: form.dob || null,

        chief_complaint:
          form.chief_complaint || null,

        medical_history:
          form.medical_history || null,

        dental_history:
          form.dental_history || null,

        family_history:
          form.family_history || null,

        allergies:
          form.allergies || null,

        blood_pressure:
          form.blood_pressure || null,

        pulse:
          form.pulse || null,

        height:
          form.height || null,

        weight:
          form.weight || null,

        diagnosis:
          form.diagnosis || null,

        notes:
          form.notes || null
      })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      setSaving(false);
      return;
    }

    setMsg("Patient details updated successfully.");

    setSaving(false);

    setTimeout(() => {
      router.push(`/patients/${id}`);
      router.refresh();
    }, 800);
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!form.id) {
    return (
      <div className="container">
        <div className="card">
          <h2>Patient not found</h2>

          {msg && (
            <p className="error">
              {msg}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">

      <div className="space">

        <div>
          <h1>
            Edit Patient Details
          </h1>

          <p className="muted">
            Update patient registration and clinical information
          </p>
        </div>

        <button
          className="btn secondary"
          type="button"
          onClick={() => router.push(`/patients/${id}`)}
        >
          Back to Profile
        </button>

      </div>


      {/* PATIENT BASIC INFORMATION */}

      <div className="card">

        <h2>
          Patient Information
        </h2>

        <div className="grid grid2">

          <div>

            <label>
              Name
            </label>

            <input
              value={form.full_name || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  full_name: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Age
            </label>

            <input
              type="number"
              min="0"
              value={form.age ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  age: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Gender
            </label>

            <select
              value={form.gender || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  gender: e.target.value
                })
              }
            >

              <option value="">
                Select
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>


          <div>

            <label>
              Occupation
            </label>

            <input
              value={form.occupation || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  occupation: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Phone
            </label>

            <input
              type="tel"
              value={form.phone || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Email
            </label>

            <input
              type="email"
              value={form.email || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Date of Birth
            </label>

            <input
              type="date"
              value={form.dob || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  dob: e.target.value
                })
              }
            />

          </div>


          <div
            style={{
              gridColumn: "1 / -1"
            }}
          >

            <label>
              Address
            </label>

            <textarea
              value={form.address || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value
                })
              }
            />

          </div>

        </div>

      </div>


      {/* CLINICAL INFORMATION */}

      <div
        className="card"
        style={{ marginTop: 20 }}
      >

        <h2>
          Clinical Information
        </h2>


        <label>
          Chief Complaint
        </label>

        <textarea
          value={form.chief_complaint || ""}
          onChange={(e) =>
            setForm({
              ...form,
              chief_complaint: e.target.value
            })
          }
        />


        <label>
          Medical History
        </label>

        <textarea
          value={form.medical_history || ""}
          onChange={(e) =>
            setForm({
              ...form,
              medical_history: e.target.value
            })
          }
        />


        <label>
          Dental History
        </label>

        <textarea
          value={form.dental_history || ""}
          onChange={(e) =>
            setForm({
              ...form,
              dental_history: e.target.value
            })
          }
        />


        <label>
          Family History
        </label>

        <textarea
          value={form.family_history || ""}
          onChange={(e) =>
            setForm({
              ...form,
              family_history: e.target.value
            })
          }
        />


        <label>
          Allergy
        </label>

        <textarea
          value={form.allergies || ""}
          onChange={(e) =>
            setForm({
              ...form,
              allergies: e.target.value
            })
          }
        />

      </div>


      {/* EXAMINATION */}

      <div
        className="card"
        style={{ marginTop: 20 }}
      >

        <h2>
          Examination
        </h2>

        <div className="grid grid2">

          <div>

            <label>
              Blood Pressure
            </label>

            <input
              value={form.blood_pressure || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  blood_pressure: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Pulse
            </label>

            <input
              value={form.pulse || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  pulse: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Height
            </label>

            <input
              value={form.height || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  height: e.target.value
                })
              }
            />

          </div>


          <div>

            <label>
              Weight
            </label>

            <input
              value={form.weight || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  weight: e.target.value
                })
              }
            />

          </div>

        </div>

      </div>


      {/* DIAGNOSIS AND NOTES */}

      <div
        className="card"
        style={{ marginTop: 20 }}
      >

        <h2>
          Diagnosis & Notes
        </h2>


        <label>
          Diagnosis
        </label>

        <textarea
          value={form.diagnosis || ""}
          onChange={(e) =>
            setForm({
              ...form,
              diagnosis: e.target.value
            })
          }
        />


        <label>
          Doctor Notes
        </label>

        <textarea
          value={form.notes || ""}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value
            })
          }
        />


        <button
          className="btn"
          type="button"
          style={{ marginTop: 20 }}
          onClick={save}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Patient Details"}
        </button>


        {msg && (
          <p className="success">
            {msg}
          </p>
        )}

      </div>

    </div>
  );
}