"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsPage() {

  const supabase = createClient();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");


  async function loadNotifications() {

    setLoading(true);

    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();


    if (!user) {
      setLoading(false);
      return;
    }


    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      })
      .limit(50);


    if (error) {

      console.log(
        "Notification loading error:",
        error
      );

      setMsg(error.message);

    }


    setItems(data ?? []);

    setLoading(false);

  }



  useEffect(() => {

    loadNotifications();

  }, []);




  async function markAsRead(
    id: number
  ) {

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true
      })
      .eq("id", id);


    if (error) {

      setMsg(error.message);
      return;

    }


    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              is_read: true
            }
          : item
      )
    );

  }




  async function markAllAsRead() {

    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();


    if (!user) return;


    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true
      })
      .eq("user_id", user.id)
      .eq("is_read", false);


    if (error) {

      setMsg(error.message);
      return;

    }


    setItems(prev =>
      prev.map(item => ({
        ...item,
        is_read: true
      }))
    );


    setMsg(
      "All notifications marked as read."
    );

  }




  const unreadCount =
    items.filter(
      item => !item.is_read
    ).length;




  return (

    <div className="container">

      <h1>
        Notifications
      </h1>



      <div
        className="card"
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10
        }}
      >

        <div>

          <strong>
            Notifications
          </strong>

          <p className="muted">
            {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}
          </p>

        </div>



        {unreadCount > 0 && (

          <button
            className="btn secondary"
            onClick={markAllAsRead}
          >
            Mark All as Read
          </button>

        )}

      </div>




      {msg && (

        <p className="success">
          {msg}
        </p>

      )}




      {loading ? (

        <div className="card">

          <p className="muted">
            Loading notifications...
          </p>

        </div>

      ) : (

        <div className="grid">

          {items.length ? (

            items.map(n => (

              <div
                className="card"
                key={n.id}
                style={{
                  borderLeft:
                    n.is_read
                      ? undefined
                      : "4px solid currentColor"
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10
                  }}
                >

                  <strong>
                    {n.title}
                  </strong>


                  {!n.is_read && (

                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      NEW
                    </span>

                  )}

                </div>



                <p>
                  {n.message}
                </p>



                <small className="muted">

                  {new Date(
                    n.created_at
                  ).toLocaleString()}

                </small>



                {!n.is_read && (

                  <div style={{ marginTop: 12 }}>

                    <button
                      className="btn secondary"
                      onClick={() =>
                        markAsRead(n.id)
                      }
                    >
                      Mark as Read
                    </button>

                  </div>

                )}

              </div>

            ))

          ) : (

            <div className="card">

              <p>
                No notifications yet.
              </p>

            </div>

          )}

        </div>

      )}

    </div>

  );

}