import { requirePermission } from "@/lib/requirePermission";
import AssistantClient from "./AssistantClient";


export default async function AssistantPage(){

  await requirePermission("assistant");


  return (
    <AssistantClient />
  );

}