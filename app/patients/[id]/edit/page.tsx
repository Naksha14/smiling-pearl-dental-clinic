import { requirePermission } from "@/lib/requirePermission";
import EditPatientClient from "./EditPatientClient";

export default async function EditPatientPage() {
  await requirePermission("patients");

  return <EditPatientClient />;
}