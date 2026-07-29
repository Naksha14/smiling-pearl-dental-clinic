import { requirePermission } from "@/lib/requirePermission";
import PatientCallingClient from "./PatientCallingClient";

export default async function PatientCallingPage() {

  await requirePermission("patient-calling");

  return (
    <PatientCallingClient />
  );

}