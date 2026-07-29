import { requirePermission } from "@/lib/requirePermission";
import PatientsClient from "./PatientsClient";

export default async function PatientsPage() {
  await requirePermission("patients");

  return <PatientsClient />;
}