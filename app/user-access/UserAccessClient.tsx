"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const modules = [
  "patients",
  "appointments",
  "inventory",
  "case-paper",
  "prescriptions",
  "patient-calling",
  "reception-listener",
  "notifications",
  "assistant",
  "reports"
];

export default function UserAccessPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [permissions, setPermissions] = useState<any>({});
  const [msg, setMsg] = useState("");

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,username,role")
      .order("full_name");

    setUsers(data ?? []);
  }

  async function loadPermissions(userId: string) {
    const { data } = await supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", userId);

    const result: any = {};

    modules.forEach((module) => {
      const existing = data?.find(
        (permission) => permission.module === module
      );

      result[module] = {
        can_view: existing?.can_view ?? false,
        can_create: existing?.can_create ?? false,
        can_edit: existing?.can_edit ?? false,
        can_delete: existing?.can_delete ?? false
      };
    });

    setPermissions(result);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function changePermission(
    module: string,
    field: string
  ) {
    setPermissions({
      ...permissions,
      [module]: {
        ...permissions[module],
        [field]: !permissions[module][field]
      }
    });

    setMsg("");
  }

  async function save() {
    if (!selectedUser) {
      setMsg("Select a user first.");
      return;
    }

    setMsg("");

    for (const module of modules) {
      const { error } = await supabase
        .from("user_permissions")
        .upsert(
          {
            user_id: selectedUser,
            module,

            can_view:
              permissions[module]?.can_view ?? false,

            can_create:
              permissions[module]?.can_create ?? false,

            can_edit:
              permissions[module]?.can_edit ?? false,

            can_delete:
              permissions[module]?.can_delete ?? false
          },
          {
            onConflict: "user_id,module"
          }
        );

      if (error) {
        setMsg(error.message);
        return;
      }
    }

    setMsg("Permissions saved successfully.");
  }

  return (
    <div className="container">

      <h1>User Access Management</h1>

      <div className="card">

        <label>
          Select User
        </label>

        <select
          value={selectedUser}
          onChange={(e) => {
            const userId = e.target.value;

            setSelectedUser(userId);
            setMsg("");

            if (userId) {
              loadPermissions(userId);
            } else {
              setPermissions({});
            }
          }}
        >

          <option value="">
            Select user
          </option>

          {users.map((user) => (
            <option
              key={user.id}
              value={user.id}
            >
              {user.full_name} ({user.role})
            </option>
          ))}

        </select>

      </div>

      {selectedUser && (
        <div
          className="card"
          style={{ marginTop: 20 }}
        >

          <h2>
            Permissions
          </h2>

          <table>

            <thead>
              <tr>
                <th>Module</th>
                <th>View</th>
                <th>Create</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>

              {modules.map((module) => (
                <tr key={module}>

                  <td>
                    {module}
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={
                        permissions[module]?.can_view ?? false
                      }
                      onChange={() =>
                        changePermission(
                          module,
                          "can_view"
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={
                        permissions[module]?.can_create ?? false
                      }
                      onChange={() =>
                        changePermission(
                          module,
                          "can_create"
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={
                        permissions[module]?.can_edit ?? false
                      }
                      onChange={() =>
                        changePermission(
                          module,
                          "can_edit"
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={
                        permissions[module]?.can_delete ?? false
                      }
                      onChange={() =>
                        changePermission(
                          module,
                          "can_delete"
                        )
                      }
                    />
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

          <button
            className="btn"
            onClick={save}
            style={{ marginTop: 20 }}
          >
            Save Permissions
          </button>

          {msg && (
            <p className="success">
              {msg}
            </p>
          )}

        </div>
      )}

    </div>
  );
}