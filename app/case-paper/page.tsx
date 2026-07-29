import { requireDoctor } from "@/lib/auth";
import CasePaperClient from "./CasePaperClient";

export default async function CasePaperPage() {
  await requireDoctor();

  return <CasePaperClient />;
}