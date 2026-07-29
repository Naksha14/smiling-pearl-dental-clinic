import Link from "next/link";
import { hasPermission } from "@/lib/permissions";
import NotificationBadge from "@/components/NotificationBadge";

export default async function Sidebar({
  role,
}: {
  role: string;
}) {
  const doctor = role === "doctor";
  const receptionist = role === "receptionist";

  const canPatients =
    doctor ||
    (await hasPermission("patients", "view"));

  const canAppointments =
    doctor ||
    (await hasPermission("appointments", "view"));

  const canInventory =
    doctor ||
    (await hasPermission("inventory", "view"));

  const canCasePaper =
    doctor ||
    (await hasPermission("case-paper", "view"));

  const canPrescriptions =
    doctor ||
    (await hasPermission("prescriptions", "view"));

  const canNotifications =
    doctor ||
    (await hasPermission("notifications", "view"));

  const canReports =
    doctor ||
    (await hasPermission("reports", "view"));

  const canAssistant =
    doctor ||
    (await hasPermission("assistant", "view"));

  const canPatientCalling =
    doctor ||
    (await hasPermission("patient-calling", "view"));

  const canReceptionListener =
    doctor || receptionist;

  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="sidebarBrand">

        <div className="brandIcon">
          🦷
        </div>

        <div>
          <h2>Smiling Pearl</h2>

          <p>
            Dental Clinic
          </p>
        </div>

      </div>


      {/* ROLE */}

      <div className="sidebarRole">
        {doctor ? "Doctor Portal" : "Reception Portal"}
      </div>


      {/* MAIN */}

      <div className="sidebarSection">

        <div className="sidebarSectionTitle">
          MAIN
        </div>


        <Link
          href="/dashboard"
          className="sidebarLink"
        >
          <span className="sidebarIcon">
            ⌂
          </span>

          <span>
            Dashboard
          </span>
        </Link>


        {canPatients && (
          <Link
            href="/patients"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ♙
            </span>

            <span>
              Patient Registration
            </span>
          </Link>
        )}


        {canAppointments && (
          <Link
            href="/appointments"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ◫
            </span>

            <span>
              Appointment Booking
            </span>
          </Link>
        )}

      </div>


      {/* CLINICAL */}

      <div className="sidebarSection">

        <div className="sidebarSectionTitle">
          CLINICAL
        </div>


        {canCasePaper && (
          <Link
            href="/case-paper"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ▤
            </span>

            <span>
              Case Paper
            </span>
          </Link>
        )}


        {canPrescriptions && (
          <Link
            href="/prescriptions"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ✚
            </span>

            <span>
              Prescriptions
            </span>
          </Link>
        )}


        {canPatientCalling && (
          <Link
            href="/patient-calling"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ☎
            </span>

            <span>
              Patient Calling
            </span>
          </Link>
        )}


        {canReceptionListener && (
          <Link
            href="/reception-listener"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ◉
            </span>

            <span>
              Reception Calling
            </span>
          </Link>
        )}

      </div>


      {/* MANAGEMENT */}

      <div className="sidebarSection">

        <div className="sidebarSectionTitle">
          MANAGEMENT
        </div>


        {canInventory && (
          <Link
            href="/inventory"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ▦
            </span>

            <span>
              Inventory
            </span>
          </Link>
        )}


        {canNotifications && (
          <Link
            href="/notifications"
            className="sidebarLink sidebarNotificationLink"
          >

            <span className="sidebarIcon">
              ♢
            </span>

            <span>
              Notifications
            </span>

            <span className="sidebarBadge">
              <NotificationBadge />
            </span>

          </Link>
        )}


        {canReports && (
          <Link
            href="/reports"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ◩
            </span>

            <span>
              Reports
            </span>
          </Link>
        )}

      </div>


      {/* TOOLS */}

      {doctor && (
        <div className="sidebarSection">

          <div className="sidebarSectionTitle">
            TOOLS
          </div>


          {canAssistant && (
            <Link
              href="/assistant"
              className="sidebarLink"
            >
              <span className="sidebarIcon">
                ✦
              </span>

              <span>
                Doctor Assistant
              </span>
            </Link>
          )}


          <Link
            href="/user-access"
            className="sidebarLink"
          >
            <span className="sidebarIcon">
              ◉
            </span>

            <span>
              User Access
            </span>
          </Link>

        </div>
      )}


      {/* FOOTER */}

      <div className="sidebarFooter">

        <div className="sidebarFooterIcon">
          ✦
        </div>

        <div>
          <strong>
            Smiling Pearl
          </strong>

          <span>
            Dental Management
          </span>
        </div>

      </div>

    </aside>
  );
}