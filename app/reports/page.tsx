import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/requirePermission";

export default async function Reports(){

  await requirePermission("reports");


  const supabase = await createClient();


  const { count: patients } = await supabase
    .from("patients")
    .select("*", { count:"exact", head:true })
    .is("deleted_at", null);



  const { count: treatments } = await supabase
    .from("treatment_records")
    .select("*", { count:"exact", head:true })
    .is("deleted_at", null);



  return (

    <div className="container">

      <h1>
        Reports & Analytics
      </h1>


      <div className="grid grid2">


        <div className="card">

          <div className="muted">
            Active Patients
          </div>

          <div className="stat">
            {patients ?? 0}
          </div>

        </div>



        <div className="card">

          <div className="muted">
            Treatment Records
          </div>

          <div className="stat">
            {treatments ?? 0}
          </div>

        </div>


      </div>


    </div>

  );

}