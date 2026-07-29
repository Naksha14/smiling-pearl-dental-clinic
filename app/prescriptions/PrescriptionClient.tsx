"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Patient = {
  id: number;
  patient_code: string | null;
  opd_no: string | null;
  full_name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  allergies: string | null;
  medical_history: string | null;
};

type Medicine = {
  id: number;
  name: string;
  strength: string | null;
  dosage_form: string | null;
  default_instructions: string | null;
};

type PrescriptionItem = {
  medicine_id: string;
  medicine_name: string;
  strength: string;
  dosage_form: string;

  dosage: string;
  frequency: string;
  duration: string;

  before_morning: boolean;
  before_afternoon: boolean;
  before_night: boolean;

  after_morning: boolean;
  after_afternoon: boolean;
  after_night: boolean;

  instructions_english: string;
  instructions_kannada: string;
  instructions_marathi: string;
};

type Prescription = {
  id: number;
  patient_id: number;
  doctor_id: string | null;
  prescription_date: string | null;
  opd_no: string | null;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  meal_guide_english: string | null;
  meal_guide_kannada: string | null;
  meal_guide_marathi: string | null;
  created_at: string;

  prescription_items: PrescriptionItem[];
};

const timingOptions = [
  {
    key: "before_morning",
    title: "Morning",
    subtitle: "Before food",
  },
  {
    key: "after_morning",
    title: "Morning",
    subtitle: "After food",
  },
  {
    key: "before_afternoon",
    title: "Afternoon",
    subtitle: "Before food",
  },
  {
    key: "after_afternoon",
    title: "Afternoon",
    subtitle: "After food",
  },
  {
    key: "before_night",
    title: "Night",
    subtitle: "Before food",
  },
  {
    key: "after_night",
    title: "Night",
    subtitle: "After food",
  },
] as const;

export default function PrescriptionPage() {
  const supabase = createClient();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [patientId, setPatientId] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");

  const [items, setItems] = useState<PrescriptionItem[]>([]);

  const [mealGuide, setMealGuide] = useState({
    english: "",
    kannada: "",
    marathi: "",
  });

  const [medicineLoading, setMedicineLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadPatients();
    loadMedicines();
  }, []);

  async function loadPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select(`
        id,
        patient_code,
        opd_no,
        full_name,
        age,
        gender,
        phone,
        allergies,
        medical_history
      `)
      .is("deleted_at", null)
      .order("full_name");

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return;
    }

    setPatients(data ?? []);
  }

  async function loadMedicines() {
    setMedicineLoading(true);

    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
    }

    setMedicines(data ?? []);
    setMedicineLoading(false);
  }

  async function loadPreviousPrescriptions(id: string) {
    if (!id) {
      setPrescriptions([]);
      return;
    }

    setHistoryLoading(true);

    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        patient_id,
        doctor_id,
        prescription_date,
        opd_no,
        medicine_name,
        dosage,
        frequency,
        duration,
        instructions,
        meal_guide_english,
        meal_guide_kannada,
        meal_guide_marathi,
        created_at,
        prescription_items (
          medicine_id,
          medicine_name,
          strength,
          dosage_form,
          dosage,
          frequency,
          duration,
          before_morning,
          before_afternoon,
          before_night,
          after_morning,
          after_afternoon,
          after_night,
          instructions_english,
          instructions_kannada,
          instructions_marathi
        )
      `)
      .eq("patient_id", Number(id))
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      setPrescriptions([]);
    } else {
      setPrescriptions((data as Prescription[]) ?? []);
    }

    setHistoryLoading(false);
  }

  function handlePatientChange(id: string) {
    setPatientId(id);

    const patient =
      patients.find((p) => String(p.id) === id) ?? null;

    setSelectedPatient(patient);
    setPatientSearch("");
    setItems([]);
    setMsg("");
    setErrorMsg("");

    loadPreviousPrescriptions(id);
  }

  function addMedicine() {
    setItems((current) => [
      ...current,
      {
        medicine_id: "",
        medicine_name: "",
        strength: "",
        dosage_form: "",

        dosage: "",
        frequency: "",
        duration: "",

        before_morning: false,
        before_afternoon: false,
        before_night: false,

        after_morning: false,
        after_afternoon: false,
        after_night: false,

        instructions_english: "",
        instructions_kannada: "",
        instructions_marathi: "",
      },
    ]);
  }

  function removeMedicine(index: number) {
    setItems((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function updateItem(
    index: number,
    key: keyof PrescriptionItem,
    value: any
  ) {
    setItems((current) => {
      const copy = [...current];

      copy[index] = {
        ...copy[index],
        [key]: value,
      };

      if (key === "medicine_id") {
        const medicine = medicines.find(
          (m) => String(m.id) === value
        );

        if (medicine) {
          copy[index].medicine_name = medicine.name;
          copy[index].strength = medicine.strength ?? "";
          copy[index].dosage_form =
            medicine.dosage_form ?? "";

          copy[index].instructions_english =
            medicine.default_instructions ?? "";
        }
      }

      return copy;
    });
  }

  function getTiming(item: PrescriptionItem) {
    const timings: string[] = [];

    if (item.before_morning) timings.push("Before Morning");
    if (item.after_morning) timings.push("After Morning");
    if (item.before_afternoon)
      timings.push("Before Afternoon");
    if (item.after_afternoon)
      timings.push("After Afternoon");
    if (item.before_night) timings.push("Before Night");
    if (item.after_night) timings.push("After Night");

    return timings;
  }

  const filteredPatients = useMemo(() => {
    const search = patientSearch.toLowerCase().trim();

    if (!search) return patients;

    return patients.filter((p) =>
      [
        p.full_name,
        p.patient_code,
        p.opd_no,
        p.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [patients, patientSearch]);

  const filteredMedicines = useMemo(() => {
    const search = medicineSearch.toLowerCase().trim();

    if (!search) return medicines;

    return medicines.filter((m) =>
      [
        m.name,
        m.strength,
        m.dosage_form,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [medicines, medicineSearch]);

  async function save() {
    setMsg("");
    setErrorMsg("");

    if (!patientId) {
      setErrorMsg("Please select a patient.");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Please add at least one medicine.");
      return;
    }

    for (const item of items) {
      if (!item.medicine_name) {
        setErrorMsg(
          "Please select a medicine for every medicine card."
        );
        return;
      }

      if (!item.dosage) {
        setErrorMsg(
          `Please enter dosage for ${item.medicine_name}.`
        );
        return;
      }

      if (!item.frequency) {
        setErrorMsg(
          `Please enter frequency for ${item.medicine_name}.`
        );
        return;
      }

      if (!item.duration) {
        setErrorMsg(
          `Please enter duration for ${item.medicine_name}.`
        );
        return;
      }
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Doctor session not found.");
      setSaving(false);
      return;
    }

    const firstItem = items[0];

    const { data: prescription, error } =
      await supabase
        .from("prescriptions")
        .insert({
          patient_id: Number(patientId),
          doctor_id: user.id,

          opd_no:
            selectedPatient?.opd_no ||
            selectedPatient?.patient_code ||
            null,

          medicine_name: firstItem.medicine_name,
          dosage: firstItem.dosage,
          frequency: firstItem.frequency,
          duration: firstItem.duration,

          instructions:
            firstItem.instructions_english || null,

          meal_guide_english: mealGuide.english || null,
          meal_guide_kannada: mealGuide.kannada || null,
          meal_guide_marathi: mealGuide.marathi || null,
        })
        .select()
        .single();

    if (error || !prescription) {
      console.error(error);
      setErrorMsg(
        error?.message || "Unable to save prescription."
      );
      setSaving(false);
      return;
    }

    const rows = items.map((item) => ({
      prescription_id: prescription.id,

      medicine_id: item.medicine_id
        ? Number(item.medicine_id)
        : null,

      medicine_name: item.medicine_name,
      strength: item.strength || null,
      dosage_form: item.dosage_form || null,

      dosage: item.dosage || null,
      frequency: item.frequency || null,
      duration: item.duration || null,

      before_morning: item.before_morning,
      before_afternoon: item.before_afternoon,
      before_night: item.before_night,

      after_morning: item.after_morning,
      after_afternoon: item.after_afternoon,
      after_night: item.after_night,

      instructions_english:
        item.instructions_english || null,

      instructions_kannada:
        item.instructions_kannada || null,

      instructions_marathi:
        item.instructions_marathi || null,
    }));

    const { error: itemError } = await supabase
      .from("prescription_items")
      .insert(rows);

    if (itemError) {
      await supabase
        .from("prescriptions")
        .delete()
        .eq("id", prescription.id)
        .eq("doctor_id", user.id);

      setErrorMsg(itemError.message);
      setSaving(false);
      return;
    }

    setMsg("Prescription saved successfully.");

    setItems([]);

    setMealGuide({
      english: "",
      kannada: "",
      marathi: "",
    });

    await loadPreviousPrescriptions(patientId);

    setSaving(false);
  }

  async function deletePrescription(id: number) {
    const confirmed = window.confirm(
      "Delete this prescription permanently?"
    );

    if (!confirmed) return;

    setMsg("");
    setErrorMsg("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Doctor session not found.");
      return;
    }

    const { error } = await supabase
      .from("prescriptions")
      .delete()
      .eq("id", id)
      .eq("doctor_id", user.id);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMsg("Prescription deleted successfully.");

    await loadPreviousPrescriptions(patientId);
  }

  function printPrescription(
    prescription: Prescription
  ) {
    const patient = selectedPatient;

    const itemsHtml =
      prescription.prescription_items
        ?.map((item) => {
          const timing = getTiming(item);

          return `
            <tr>
              <td>
                <strong>${item.medicine_name}</strong><br/>
                ${item.strength ?? ""} ${
            item.dosage_form ?? ""
          }
              </td>

              <td>${item.dosage ?? "-"}</td>
              <td>${item.frequency ?? "-"}</td>
              <td>${item.duration ?? "-"}</td>

              <td>
                ${
                  timing.length
                    ? timing.join(", ")
                    : "-"
                }
              </td>

              <td>
                ${item.instructions_english ?? "-"}
              </td>
            </tr>
          `;
        })
        .join("") ?? "";

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!printWindow) {
      setErrorMsg(
        "Please allow pop-ups to print the prescription."
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Smiling Pearl Prescription</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 35px;
            color: #17313d;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #1596a5;
            padding-bottom: 18px;
          }

          .header h1 {
            margin: 0;
            color: #073b4c;
          }

          .header p {
            margin: 6px 0 0;
            color: #607d86;
          }

          .patient {
            margin-top: 25px;
            padding: 18px;
            border: 1px solid #d7e5e9;
            border-radius: 12px;
          }

          .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
          }

          th,
          td {
            border: 1px solid #d7e0e3;
            padding: 9px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #edf7f8;
          }

          .guide {
            margin-top: 25px;
            padding: 18px;
            border: 1px solid #d7e5e9;
            border-radius: 12px;
          }

          .signature {
            margin-top: 80px;
            text-align: right;
          }

          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>

      <body>

        <div class="header">
          <h1>Smiling Pearl Dental Clinic</h1>
          <p>Prescription</p>
        </div>

        <div class="patient">
          <h3>Patient Details</h3>

          <div class="patient-grid">
            <div>
              <strong>Name:</strong>
              ${patient?.full_name ?? "-"}
            </div>

            <div>
              <strong>OPD:</strong>
              ${
                patient?.opd_no ??
                patient?.patient_code ??
                "-"
              }
            </div>

            <div>
              <strong>Age:</strong>
              ${patient?.age ?? "-"}
            </div>

            <div>
              <strong>Gender:</strong>
              ${patient?.gender ?? "-"}
            </div>

            <div>
              <strong>Phone:</strong>
              ${patient?.phone ?? "-"}
            </div>

            <div>
              <strong>Date:</strong>
              ${
                prescription.prescription_date ??
                new Date().toLocaleDateString()
              }
            </div>
          </div>

          <p>
            <strong>Allergies:</strong>
            ${patient?.allergies || "None recorded"}
          </p>
        </div>

        <h3>Medicines</h3>

        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Timing</th>
              <th>Instructions</th>
            </tr>
          </thead>

          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        ${
          prescription.meal_guide_english ||
          prescription.meal_guide_kannada ||
          prescription.meal_guide_marathi
            ? `
              <div class="guide">
                <h3>Meal Guide</h3>

                ${
                  prescription.meal_guide_english
                    ? `<p>
                        <strong>English:</strong><br/>
                        ${prescription.meal_guide_english}
                       </p>`
                    : ""
                }

                ${
                  prescription.meal_guide_kannada
                    ? `<p>
                        <strong>Kannada:</strong><br/>
                        ${prescription.meal_guide_kannada}
                       </p>`
                    : ""
                }

                ${
                  prescription.meal_guide_marathi
                    ? `<p>
                        <strong>Marathi:</strong><br/>
                        ${prescription.meal_guide_marathi}
                       </p>`
                    : ""
                }
              </div>
            `
            : ""
        }

        <div class="signature">
          <strong>Doctor's Signature</strong>
        </div>

      </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  return (
    <div className="container prescriptionPage">

      {/* PAGE HEADER */}

      <div className="prescriptionPageHeader">
        <div>
          <div className="pageEyebrow">
            CLINICAL MANAGEMENT
          </div>

          <h1>Prescriptions</h1>

          <p>
            Create and manage patient medication plans
            securely.
          </p>
        </div>

        <div className="prescriptionHeaderIcon">
          ✚
        </div>
      </div>


      {/* ALERTS */}

      {msg && (
        <div className="clinicAlert successAlert">
          <span className="alertIcon">✓</span>
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="clinicAlert errorAlert">
          <span className="alertIcon">!</span>
          <span>{errorMsg}</span>
        </div>
      )}


      {/* PATIENT SELECTION */}

      <section className="clinicSection">

        <div className="sectionHeader">
          <div className="sectionNumber">
            01
          </div>

          <div>
            <h2>Select Patient</h2>
            <p>
              Choose the patient before creating a
              prescription.
            </p>
          </div>
        </div>


        <div className="patientSearchBox">

          <div className="searchInputWrap">
            <span>⌕</span>

            <input
              value={patientSearch}
              onChange={(e) =>
                setPatientSearch(e.target.value)
              }
              placeholder="Search by patient name, OPD number or phone..."
            />
          </div>

          <select
            value={patientId}
            onChange={(e) =>
              handlePatientChange(e.target.value)
            }
          >
            <option value="">
              Select a patient
            </option>

            {filteredPatients.map((p) => (
              <option
                key={p.id}
                value={p.id}
              >
                {p.full_name}
                {p.opd_no
                  ? ` — OPD ${p.opd_no}`
                  : ""}
              </option>
            ))}
          </select>

        </div>

        {!patientId && (
          <div className="emptyPatientState">
            <div className="emptyStateIcon">
              ♙
            </div>

            <strong>
              No patient selected
            </strong>

            <span>
              Search and select a patient to begin
              the prescription.
            </span>
          </div>
        )}

      </section>


      {/* PATIENT PROFILE */}

      {selectedPatient && (
        <section className="patientProfileCard">

          <div className="patientAvatar">
            {selectedPatient.full_name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="patientMainInfo">
            <div className="patientName">
              {selectedPatient.full_name}
            </div>

            <div className="patientIdentifiers">
              <span>
                OPD{" "}
                {selectedPatient.opd_no ||
                  selectedPatient.patient_code ||
                  "—"}
              </span>

              <span>
                Patient ID{" "}
                {selectedPatient.patient_code ||
                  "—"}
              </span>
            </div>
          </div>

          <div className="patientQuickStats">

            <div>
              <span>Age</span>
              <strong>
                {selectedPatient.age ?? "—"}
              </strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>
                {selectedPatient.gender || "—"}
              </strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>
                {selectedPatient.phone || "—"}
              </strong>
            </div>

          </div>

        </section>
      )}


      {/* ALLERGY WARNING */}

      {selectedPatient?.allergies && (
        <div className="allergyWarning">
          <div className="warningIcon">
            !
          </div>

          <div>
            <strong>
              Allergy information
            </strong>

            <p>
              {selectedPatient.allergies}
            </p>
          </div>
        </div>
      )}


      {selectedPatient && (
        <>

          {/* MEDICINES */}

          <section className="clinicSection">

            <div className="sectionHeader">
              <div className="sectionNumber">
                02
              </div>

              <div>
                <h2>Medication Plan</h2>
                <p>
                  Add medicines and define how they
                  should be taken.
                </p>
              </div>

              <div className="sectionHeaderRight">
                <span className="medicineCount">
                  {items.length}{" "}
                  {items.length === 1
                    ? "medicine"
                    : "medicines"}
                </span>
              </div>
            </div>


            {medicineLoading && (
              <div className="loadingBox">
                <div className="loadingSpinner" />
                Loading medicine catalogue...
              </div>
            )}


            {!medicineLoading &&
              items.length === 0 && (
                <div className="medicineEmptyState">

                  <div className="medicineEmptyIcon">
                    ✚
                  </div>

                  <h3>
                    No medicines added
                  </h3>

                  <p>
                    Start by adding the first
                    medicine to this prescription.
                  </p>

                  <button
                    className="btn"
                    type="button"
                    onClick={addMedicine}
                  >
                    + Add First Medicine
                  </button>

                </div>
              )}


            <div className="medicineList">

              {items.map((item, index) => (

                <article
                  key={index}
                  className="medicineCard"
                >

                  <div className="medicineCardTop">

                    <div className="medicineNumber">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="medicineTitle">
                      <span>
                        MEDICATION
                      </span>

                      <h3>
                        {item.medicine_name ||
                          "New medicine"}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="removeMedicine"
                      onClick={() =>
                        removeMedicine(index)
                      }
                    >
                      Remove
                    </button>

                  </div>


                  {/* MEDICINE SEARCH */}

                  <div className="medicineSearchRow">

                    <div className="fieldGroup medicineSelectField">

                      <label>
                        Medicine
                      </label>

                      <select
                        value={item.medicine_id}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "medicine_id",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select medicine
                        </option>

                        {filteredMedicines.map(
                          (m) => (
                            <option
                              key={m.id}
                              value={m.id}
                            >
                              {m.name}
                              {m.strength
                                ? ` — ${m.strength}`
                                : ""}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    <div className="fieldGroup medicineSearchField">

                      <label>
                        Find medicine
                      </label>

                      <input
                        value={medicineSearch}
                        onChange={(e) =>
                          setMedicineSearch(
                            e.target.value
                          )
                        }
                        placeholder="Search medicine..."
                      />

                    </div>

                  </div>


                  {item.medicine_name && (
                    <div className="medicineMeta">

                      <span>
                        {item.strength ||
                          "Strength not specified"}
                      </span>

                      <span>
                        {item.dosage_form ||
                          "Form not specified"}
                      </span>

                    </div>
                  )}


                  {/* DOSAGE DETAILS */}

                  <div className="formGrid3">

                    <div className="fieldGroup">

                      <label>
                        Dosage
                      </label>

                      <input
                        value={item.dosage}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "dosage",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 1 tablet"
                      />

                    </div>

                    <div className="fieldGroup">

                      <label>
                        Frequency
                      </label>

                      <input
                        value={item.frequency}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "frequency",
                            e.target.value
                          )
                        }
                        placeholder="e.g. Twice daily"
                      />

                    </div>

                    <div className="fieldGroup">

                      <label>
                        Duration
                      </label>

                      <input
                        value={item.duration}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "duration",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 5 days"
                      />

                    </div>

                  </div>


                  {/* TIMING */}

                  <div className="timingSection">

                    <div className="subsectionTitle">
                      <span>◷</span>
                      Medicine timing
                    </div>

                    <div className="timingGrid">

                      {timingOptions.map(
                        (option) => {

                          const checked =
                            Boolean(
                              item[
                                option.key
                              ]
                            );

                          return (
                            <label
                              key={option.key}
                              className={
                                checked
                                  ? "timingOption active"
                                  : "timingOption"
                              }
                            >

                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    option.key,
                                    e.target.checked
                                  )
                                }
                              />

                              <span className="timingCheck">
                                {checked
                                  ? "✓"
                                  : ""}
                              </span>

                              <span>
                                <strong>
                                  {option.title}
                                </strong>

                                <small>
                                  {option.subtitle}
                                </small>
                              </span>

                            </label>
                          );
                        }
                      )}

                    </div>

                  </div>


                  {/* INSTRUCTIONS */}

                  <div className="instructionSection">

                    <div className="subsectionTitle">
                      <span>☷</span>
                      Patient instructions
                    </div>

                    <div className="instructionGrid">

                      <div className="fieldGroup">

                        <label>
                          English
                        </label>

                        <textarea
                          value={
                            item.instructions_english
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              "instructions_english",
                              e.target.value
                            )
                          }
                          placeholder="Instructions for the patient..."
                        />

                      </div>

                      <div className="fieldGroup">

                        <label>
                          Kannada
                        </label>

                        <textarea
                          value={
                            item.instructions_kannada
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              "instructions_kannada",
                              e.target.value
                            )
                          }
                          placeholder="ರೋಗಿಗೆ ಸೂಚನೆಗಳು..."
                        />

                      </div>

                      <div className="fieldGroup">

                        <label>
                          Marathi
                        </label>

                        <textarea
                          value={
                            item.instructions_marathi
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              "instructions_marathi",
                              e.target.value
                            )
                          }
                          placeholder="रुग्णासाठी सूचना..."
                        />

                      </div>

                    </div>

                  </div>

                </article>

              ))}

            </div>


            {items.length > 0 && (
              <button
                type="button"
                className="addMedicineButton"
                onClick={addMedicine}
              >
                <span>+</span>
                Add another medicine
              </button>
            )}

          </section>


          {/* MEAL GUIDE */}

          <section className="clinicSection">

            <div className="sectionHeader">
              <div className="sectionNumber">
                03
              </div>

              <div>
                <h2>Meal & Care Guide</h2>
                <p>
                  Add additional instructions for the
                  patient's care.
                </p>
              </div>
            </div>


            <div className="mealGuideGrid">

              <div className="mealLanguageCard">

                <div className="languageBadge">
                  EN
                </div>

                <div>
                  <strong>
                    English
                  </strong>

                  <span>
                    General instructions
                  </span>
                </div>

                <textarea
                  value={mealGuide.english}
                  onChange={(e) =>
                    setMealGuide({
                      ...mealGuide,
                      english: e.target.value,
                    })
                  }
                  placeholder="Example: Avoid very hot food for 24 hours..."
                />

              </div>


              <div className="mealLanguageCard">

                <div className="languageBadge">
                  ಕನ್ನಡ
                </div>

                <div>
                  <strong>
                    Kannada
                  </strong>

                  <span>
                    ಸಾಮಾನ್ಯ ಸೂಚನೆಗಳು
                  </span>
                </div>

                <textarea
                  value={mealGuide.kannada}
                  onChange={(e) =>
                    setMealGuide({
                      ...mealGuide,
                      kannada: e.target.value,
                    })
                  }
                  placeholder="ರೋಗಿಗೆ ಅಗತ್ಯವಿರುವ ಸೂಚನೆಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ..."
                />

              </div>


              <div className="mealLanguageCard">

                <div className="languageBadge">
                  म
                </div>

                <div>
                  <strong>
                    Marathi
                  </strong>

                  <span>
                    सामान्य सूचना
                  </span>
                </div>

                <textarea
                  value={mealGuide.marathi}
                  onChange={(e) =>
                    setMealGuide({
                      ...mealGuide,
                      marathi: e.target.value,
                    })
                  }
                  placeholder="रुग्णासाठी आवश्यक सूचना येथे लिहा..."
                />

              </div>

            </div>

          </section>


          {/* SAVE */}

          <section className="savePrescriptionBar">

            <div>
              <strong>
                Ready to save prescription?
              </strong>

              <span>
                {items.length
                  ? `${items.length} medicine${
                      items.length > 1
                        ? "s"
                        : ""
                    } added`
                  : "Add at least one medicine"}
              </span>
            </div>

            <button
              type="button"
              className="savePrescriptionButton"
              onClick={save}
              disabled={
                saving || items.length === 0
              }
            >

              {saving ? (
                <>
                  <span className="loginSpinner" />
                  Saving...
                </>
              ) : (
                <>
                  Save Prescription
                  <span>→</span>
                </>
              )}

            </button>

          </section>


          {/* HISTORY */}

          <section className="clinicSection historySection">

            <div className="sectionHeader">
              <div className="sectionNumber">
                04
              </div>

              <div>
                <h2>Prescription History</h2>
                <p>
                  Previous prescriptions for{" "}
                  <strong>
                    {selectedPatient.full_name}
                  </strong>
                </p>
              </div>
            </div>


            {historyLoading && (
              <div className="loadingBox">
                <div className="loadingSpinner" />
                Loading prescription history...
              </div>
            )}


            {!historyLoading &&
              prescriptions.length === 0 && (
                <div className="historyEmpty">

                  <div className="historyEmptyIcon">
                    ◫
                  </div>

                  <strong>
                    No previous prescriptions
                  </strong>

                  <span>
                    This patient's prescription
                    history will appear here.
                  </span>

                </div>
              )}


            <div className="historyList">

              {prescriptions.map(
                (prescription) => (

                  <article
                    key={prescription.id}
                    className="historyCard"
                  >

                    <div className="historyCardHeader">

                      <div>

                        <span className="historyLabel">
                          PRESCRIPTION
                        </span>

                        <h3>
                          #{prescription.id}
                        </h3>

                      </div>

                      <div className="historyDate">

                        <span>
                          Date
                        </span>

                        <strong>
                          {prescription.prescription_date ||
                            new Date(
                              prescription.created_at
                            ).toLocaleDateString()}
                        </strong>

                      </div>

                    </div>


                    <div className="historyMedicineList">

                      {prescription.prescription_items?.map(
                        (item, itemIndex) => (

                          <div
                            key={itemIndex}
                            className="historyMedicine"
                          >

                            <div className="historyMedicineIcon">
                              {itemIndex + 1}
                            </div>

                            <div className="historyMedicineMain">

                              <strong>
                                {item.medicine_name}
                              </strong>

                              <span>
                                {item.strength}{" "}
                                {item.dosage_form}
                              </span>

                            </div>

                            <div className="historyMedicineDetails">

                              <div>
                                <span>
                                  Dosage
                                </span>

                                <strong>
                                  {item.dosage ||
                                    "—"}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Frequency
                                </span>

                                <strong>
                                  {item.frequency ||
                                    "—"}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Duration
                                </span>

                                <strong>
                                  {item.duration ||
                                    "—"}
                                </strong>
                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>


                    {(prescription.meal_guide_english ||
                      prescription.meal_guide_kannada ||
                      prescription.meal_guide_marathi) && (

                      <div className="historyGuide">

                        <span>
                          CARE GUIDE
                        </span>

                        <p>
                          {prescription.meal_guide_english ||
                            prescription.meal_guide_kannada ||
                            prescription.meal_guide_marathi}
                        </p>

                      </div>
                    )}


                    <div className="historyActions">

                      <button
                        type="button"
                        className="historyPrintButton"
                        onClick={() =>
                          printPrescription(
                            prescription
                          )
                        }
                      >
                        Print prescription
                      </button>

                      <button
                        type="button"
                        className="historyDeleteButton"
                        onClick={() =>
                          deletePrescription(
                            prescription.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          </section>

        </>
      )}

    </div>
  );
}