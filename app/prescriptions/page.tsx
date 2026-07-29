import { requireDoctor } from "@/lib/auth";
import PrescriptionClient from "./PrescriptionClient";

export default async function PrescriptionsPage() {
  await requireDoctor();

  return <PrescriptionClient />;
}