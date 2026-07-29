import { requirePermission } from "@/lib/requirePermission";
import ReceptionListenerClient from "./ReceptionListenerClient";

export default async function ReceptionListenerPage() {

  await requirePermission("reception-listener");

  return (
    <ReceptionListenerClient />
  );
}