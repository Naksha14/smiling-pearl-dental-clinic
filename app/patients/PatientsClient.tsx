"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Patient = {
  id: number;
  patient_code: string | null;
  full_name: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  dob: string | null;
  allergies: string | null;
  medical_history: string | null;
};

type PatientForm = {
  full_name: string;
  age: string;
  gender: string;
  occupation: string;
  address: string;
  phone: string;
  email: string;
  dob: string;
  allergies: string;
  medical_history: string;
};

const emptyForm: PatientForm = {
  full_name: "",
  age: "",
  gender: "",
  occupation: "",
  address: "",
  phone: "",
  email: "",
  dob: "",
  allergies: "",
  medical_history: "",
};

export default function PatientsClient() {
  const supabase = createClient();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState<PatientForm>({
    ...emptyForm,
  });

  // --------------------------------------------------
  // GET CURRENT USER ROLE
  // --------------------------------------------------

  async function getUserRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Role loading error:", error);
      return;
    }

    setRole(data?.role || "");
  }

  // --------------------------------------------------
  // LOAD PATIENTS
  // --------------------------------------------------

  async function loadPatients() {
    setLoading(true);
    setErrorMsg("");

    let query = supabase
      .from("patients")
      .select(
        `
        id,
        patient_code,
        full_name,
        age,
        gender,
        occupation,
        address,
        phone,
        email,
        dob,
        allergies,
        medical_history
        `
      )
      .is("deleted_at", null)
      .order("id", { ascending: false });

    const searchValue = search.trim();

    if (searchValue) {
      query = query.or(
        `full_name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,patient_code.ilike.%${searchValue}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Patient loading error:", error);
      setErrorMsg(error.message);
      setPatients([]);
      setLoading(false);
      return;
    }

    setPatients((data as Patient[]) || []);
    setLoading(false);
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    getUserRole();
  }, []);

  // --------------------------------------------------
  // SEARCH PATIENTS
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // --------------------------------------------------
  // UPDATE FORM
  // --------------------------------------------------

  function updateForm(
    field: keyof PatientForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  function resetForm() {
    setForm({
      ...emptyForm,
    });

    setMsg("");
    setErrorMsg("");
  }

  // --------------------------------------------------
  // REGISTER PATIENT
  // --------------------------------------------------

  async function addPatient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMsg("");
    setErrorMsg("");

    const fullName = form.full_name.trim();
    const occupation = form.occupation.trim();
    const address = form.address.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const allergies = form.allergies.trim();
    const medicalHistory = form.medical_history.trim();

    if (!fullName) {
      setErrorMsg("Please enter the patient's full name.");
      return;
    }

    if (!form.age) {
      setErrorMsg("Please enter the patient's age.");
      return;
    }

    const age = Number(form.age);

    if (!Number.isInteger(age) || age < 0 || age > 150) {
      setErrorMsg("Please enter a valid age.");
      return;
    }

    if (!form.gender) {
      setErrorMsg("Please select the patient's gender.");
      return;
    }

    if (!occupation) {
      setErrorMsg("Please enter the patient's occupation.");
      return;
    }

    if (!phone) {
      setErrorMsg("Please enter the patient's phone number.");
      return;
    }

    if (!address) {
      setErrorMsg("Please enter the patient's address.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("patients")
      .insert({
        full_name: fullName,
        age,
        gender: form.gender,
        occupation,
        address,
        phone,
        email: email || null,
        dob: form.dob || null,

        // Clinical fields are optional.
        // Reception can leave them empty.
        allergies: allergies || null,
        medical_history: medicalHistory || null,
      });

    if (error) {
      console.error("Patient registration error:", error);

      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    setMsg("Patient registered successfully.");

    setForm({
      ...emptyForm,
    });

    await loadPatients();

    setSaving(false);
  }

  // --------------------------------------------------
  // INITIALS
  // --------------------------------------------------

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="clinicPage">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="pageHeader">

        <div>

          <div className="pageEyebrow">
            PATIENT MANAGEMENT
          </div>

          <h1>
            Patient Registration
          </h1>

          <p>
            Register new patients and quickly access
            their dental records.
          </p>

        </div>


        <div className="pageHeaderBadge">

          <span className="headerTooth">
            🦷
          </span>

          <div>

            <strong>
              Smiling Pearl
            </strong>

            <span>
              Dental Clinic
            </span>

          </div>

        </div>

      </div>


      {/* ==========================================
          STAT CARDS
      ========================================== */}

      <div className="patientStats">

        <div className="patientStatCard">

          <div className="statIcon blue">
            👥
          </div>

          <div>

            <span>
              Total Patients
            </span>

            <strong>
              {patients.length}
            </strong>

          </div>

        </div>


        <div className="patientStatCard">

          <div className="statIcon green">
            ✓
          </div>

          <div>

            <span>
              Active Records
            </span>

            <strong>
              {patients.length}
            </strong>

          </div>

        </div>


        <div className="patientStatCard">

          <div className="statIcon purple">
            🩺
          </div>

          <div>

            <span>
              Your Access
            </span>

            <strong className="roleValue">
              {role === "doctor" ? "Doctor" : "Reception"}
            </strong>

          </div>

        </div>

      </div>


      {/* ==========================================
          REGISTRATION CARD
      ========================================== */}

      <section className="patientFormCard">

        <div className="sectionHeader">

          <div className="sectionHeaderIcon">
            +
          </div>

          <div>

            <h2>
              Register New Patient
            </h2>

            <p>
              Enter the patient's basic information below.
            </p>

          </div>

        </div>


        <form onSubmit={addPatient}>

          {/* BASIC INFORMATION */}

          <div className="formSection">

            <div className="formSectionTitle">
              <span>01</span>
              Basic Information
            </div>


            <div className="formGrid">

              {/* FULL NAME */}

              <div className="field">

                <label>
                  Full Name <b>*</b>
                </label>

                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    updateForm(
                      "full_name",
                      e.target.value
                    )
                  }
                  placeholder="Enter patient's full name"
                  required
                />

              </div>


              {/* AGE */}

              <div className="field">

                <label>
                  Age <b>*</b>
                </label>

                <input
                  type="number"
                  min="0"
                  max="150"
                  value={form.age}
                  onChange={(e) =>
                    updateForm(
                      "age",
                      e.target.value
                    )
                  }
                  placeholder="Age"
                  required
                />

              </div>


              {/* GENDER */}

              <div className="field">

                <label>
                  Gender <b>*</b>
                </label>

                <select
                  value={form.gender}
                  onChange={(e) =>
                    updateForm(
                      "gender",
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select gender
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


              {/* DOB */}

              <div className="field">

                <label>
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) =>
                    updateForm(
                      "dob",
                      e.target.value
                    )
                  }
                />

              </div>


              {/* OCCUPATION */}

              <div className="field">

                <label>
                  Occupation <b>*</b>
                </label>

                <input
                  type="text"
                  value={form.occupation}
                  onChange={(e) =>
                    updateForm(
                      "occupation",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Student, Engineer"
                  required
                />

              </div>


              {/* PHONE */}

              <div className="field">

                <label>
                  Phone Number <b>*</b>
                </label>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    updateForm(
                      "phone",
                      e.target.value
                    )
                  }
                  placeholder="Enter phone number"
                  required
                />

              </div>


              {/* EMAIL */}

              <div className="field fieldFull">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateForm(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="patient@example.com"
                />

              </div>


              {/* ADDRESS */}

              <div className="field fieldFull">

                <label>
                  Address <b>*</b>
                </label>

                <textarea
                  value={form.address}
                  onChange={(e) =>
                    updateForm(
                      "address",
                      e.target.value
                    )
                  }
                  placeholder="Enter complete residential address"
                  required
                />

              </div>

            </div>

          </div>


          {/* ======================================
              CLINICAL INFORMATION
          ====================================== */}

          {role === "doctor" && (

            <div className="clinicalSection">

              <div className="formSectionTitle">
                <span>02</span>
                Clinical Information
              </div>

              <p className="clinicalNote">
                These details are visible to the doctor
                and can be used for clinical documentation.
              </p>


              <div className="formGrid">

                {/* ALLERGIES */}

                <div className="field fieldFull">

                  <label>
                    Known Allergies
                  </label>

                  <textarea
                    value={form.allergies}
                    onChange={(e) =>
                      updateForm(
                        "allergies",
                        e.target.value
                      )
                    }
                    placeholder="Enter known allergies or write 'None known'"
                  />

                </div>


                {/* MEDICAL HISTORY */}

                <div className="field fieldFull">

                  <label>
                    Medical / Dental History
                  </label>

                  <textarea
                    value={form.medical_history}
                    onChange={(e) =>
                      updateForm(
                        "medical_history",
                        e.target.value
                      )
                    }
                    placeholder="Previous dental procedures, medical conditions, medications, etc."
                  />

                </div>

              </div>

            </div>

          )}


          {/* ======================================
              FORM BUTTONS
          ====================================== */}

          <div className="formActions">

            <button
              type="button"
              className="btn btnLight"
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </button>


            <button
              type="submit"
              className="btn btnPrimary"
              disabled={saving}
            >
              {saving
                ? "Registering..."
                : "✓ Register Patient"}
            </button>

          </div>

        </form>


        {/* SUCCESS MESSAGE */}

        {msg && (

          <div className="alert successAlert">
            ✓ {msg}
          </div>

        )}


        {/* ERROR MESSAGE */}

        {errorMsg && (

          <div className="alert errorAlert">
            ⚠ {errorMsg}
          </div>

        )}

      </section>


      {/* ==========================================
          PATIENT DIRECTORY
      ========================================== */}

      <section className="patientDirectory">

        <div className="directoryHeader">

          <div>

            <div className="pageEyebrow">
              PATIENT DIRECTORY
            </div>

            <h2>
              Registered Patients
            </h2>

            <p>
              Search and open existing patient records.
            </p>

          </div>


          <div className="patientCount">
            {patients.length} Records
          </div>

        </div>


        {/* ========================================
            SEARCH
        ======================================== */}

        <div className="patientSearch">

          <span>
            🔎
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by patient name, phone number or OPD number..."
          />


          {search && (

            <button
              type="button"
              onClick={() => setSearch("")}
              className="clearSearch"
              aria-label="Clear search"
            >
              ×
            </button>

          )}

        </div>


        {/* ========================================
            PATIENT TABLE
        ======================================== */}

        <div className="patientTableWrapper">

          <table className="patientTable">

            <thead>

              <tr>

                <th>
                  Patient
                </th>

                <th>
                  OPD Number
                </th>

                <th>
                  Phone
                </th>

                <th>
                  Age / Gender
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {/* LOADING */}

              {loading && (

                <tr>

                  <td
                    colSpan={5}
                    className="emptyTable"
                  >
                    Loading patient records...
                  </td>

                </tr>

              )}


              {/* NO PATIENTS */}

              {!loading && patients.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="emptyTable"
                  >

                    <div className="emptyState">

                      <div>
                        🦷
                      </div>

                      <strong>
                        No patients found
                      </strong>

                      <span>
                        {search
                          ? "Try another search."
                          : "Register a new patient to get started."}
                      </span>

                    </div>

                  </td>

                </tr>

              )}


              {/* PATIENTS */}

              {!loading &&
                patients.length > 0 &&
                patients.map((patient) => (

                  <tr key={patient.id}>

                    {/* PATIENT */}

                    <td>

                      <div className="patientNameCell">

                        <div className="patientAvatar">
                          {getInitials(
                            patient.full_name
                          )}
                        </div>


                        <div>

                          <strong>
                            {patient.full_name}
                          </strong>

                          <span>
                            {patient.email ||
                              "No email added"}
                          </span>

                        </div>

                      </div>

                    </td>


                    {/* OPD */}

                    <td>

                      <span className="opdBadge">
                        {patient.patient_code ||
                          "N/A"}
                      </span>

                    </td>


                    {/* PHONE */}

                    <td>
                      {patient.phone || "-"}
                    </td>


                    {/* AGE / GENDER */}

                    <td>

                      <span>
                        {patient.age ?? "-"}
                      </span>

                      <span className="tableMuted">

                        {" / "}

                        {patient.gender || "-"}

                      </span>

                    </td>


                    {/* VIEW PROFILE */}

                    <td>

                      <a
                        href={`/patients/${patient.id}`}
                        className="viewPatientBtn"
                      >
                        View Profile
                        <span>
                          →
                        </span>
                      </a>

                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}