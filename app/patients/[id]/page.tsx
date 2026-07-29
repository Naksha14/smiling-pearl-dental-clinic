import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/requirePermission";
import { hasPermission } from "@/lib/permissions";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("patients");

  const { id } = await params;

  if (!id || !/^\d+$/.test(id)) {
    return (
      <div className="container">
        <div className="card">
          <h2>Patient not found</h2>

          <p className="muted">
            Patient ID is invalid.
          </p>

          <a className="btn" href="/patients">
            ← Back to Patients
          </a>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const canEdit = await hasPermission(
    "patients",
    "edit"
  );

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", Number(id))
    .is("deleted_at", null)
    .single();

  if (error || !patient) {
    return (
      <div className="container">
        <div className="card">
          <h2>Patient not found</h2>

          <p className="muted">
            {error?.message ||
              "The requested patient does not exist."}
          </p>

          <a className="btn" href="/patients">
            ← Back to Patients
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">

      {/* HEADER */}

      <div className="space">

        <div>
          <h1>Patient Profile</h1>

          <p className="muted">
            Patient Registration & Clinical Record
          </p>
        </div>

        {canEdit && (
          <a
            className="btn"
            href={`/patients/${patient.id}/edit`}
          >
            Edit Patient Details
          </a>
        )}

      </div>


      {/* BASIC INFORMATION */}

      <div className="card">

        <h2>
          {patient.full_name}
        </h2>

        <p>
          OPD No:{" "}
          <strong>
            {patient.opd_no ||
              patient.patient_code ||
              "Not available"}
          </strong>
        </p>

        <div className="grid grid2">

          <div>

            <p>
              <strong>Age:</strong>{" "}
              {patient.age ?? "Not added"}
            </p>

            <p>
              <strong>Gender:</strong>{" "}
              {patient.gender ||
                "Not added"}
            </p>

            <p>
              <strong>Occupation:</strong>{" "}
              {patient.occupation ||
                "Not added"}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {patient.phone ||
                "Not added"}
            </p>

          </div>


          <div>

            <p>
              <strong>Email:</strong>{" "}
              {patient.email ||
                "Not added"}
            </p>

            <p>
              <strong>Date of Birth:</strong>{" "}
              {patient.dob ||
                "Not added"}
            </p>

            <p>
              <strong>Address:</strong>{" "}
              {patient.address ||
                "Not added"}
            </p>

          </div>

        </div>

      </div>


      {/* CLINICAL + DENTAL */}

      <div
        className="grid grid2"
        style={{ marginTop: 20 }}
      >

        <div className="card">

          <h2>
            Clinical Information
          </h2>

          <p>
            <strong>Chief Complaint:</strong>
          </p>

          <p className="muted">
            {patient.chief_complaint ||
              "Not added yet"}
          </p>


          <p>
            <strong>Medical History:</strong>
          </p>

          <p className="muted">
            {patient.medical_history ||
              "Not added yet"}
          </p>


          <p>
            <strong>Allergy:</strong>
          </p>

          <p className="muted">
            {patient.allergies ||
              patient.allergy ||
              "Not added yet"}
          </p>


          <p>
            <strong>Family History:</strong>
          </p>

          <p className="muted">
            {patient.family_history ||
              "Not added yet"}
          </p>

        </div>


        <div className="card">

          <h2>
            Dental Information
          </h2>


          <p>
            <strong>Dental History:</strong>
          </p>

          <p className="muted">
            {patient.dental_history ||
              "Not added yet"}
          </p>


          <p>
            <strong>Diagnosis:</strong>
          </p>

          <p className="muted">
            {patient.diagnosis ||
              "Not added yet"}
          </p>


          <p>
            <strong>Notes:</strong>
          </p>

          <p className="muted">
            {patient.notes ||
              "Not added yet"}
          </p>

        </div>

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

            <p>
              <strong>Blood Pressure:</strong>{" "}
              {patient.blood_pressure ||
                "Not added yet"}
            </p>

            <p>
              <strong>Pulse:</strong>{" "}
              {patient.pulse ||
                "Not added yet"}
            </p>

          </div>


          <div>

            <p>
              <strong>Height:</strong>{" "}
              {patient.height ||
                "Not added yet"}
            </p>

            <p>
              <strong>Weight:</strong>{" "}
              {patient.weight ||
                "Not added yet"}
            </p>

          </div>

        </div>

      </div>


      {/* RECORD INFORMATION */}

      <div
        className="card"
        style={{ marginTop: 20 }}
      >

        <h2>
          Record Information
        </h2>

        <p>
          <strong>Patient Code:</strong>{" "}
          {patient.patient_code ||
            "Not available"}
        </p>

        <p>
          <strong>OPD No:</strong>{" "}
          {patient.opd_no ||
            patient.patient_code ||
            "Not available"}
        </p>

        {patient.created_at && (
          <p>
            <strong>Registered On:</strong>{" "}
            {new Date(
              patient.created_at
            ).toLocaleString()}
          </p>
        )}

      </div>


      {/* BACK */}

      <div style={{ marginTop: 20 }}>

        <a
          className="btn"
          href="/patients"
        >
          ← Back to Patients
        </a>

      </div>

    </div>
  );
}