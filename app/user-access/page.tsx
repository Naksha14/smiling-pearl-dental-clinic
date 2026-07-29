import { requireDoctor } from "@/lib/auth";
import UserAccessClient from "./UserAccessClient";

export default async function UserAccessPage() {
  await requireDoctor();

  return <UserAccessClient />;
}