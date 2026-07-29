import { requirePermission } from "@/lib/requirePermission";
import AppointmentsClient from "./AppointmentsClient";

export default async function AppointmentsPage() {
  await requirePermission("appointments");

  return <AppointmentsClient />;
}