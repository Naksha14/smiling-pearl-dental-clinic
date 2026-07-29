"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBadge() {

  const supabase = createClient();

  const [unreadCount, setUnreadCount] = useState(0);


  async function loadUnreadCount() {

    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();


    if (!user) {
      setUnreadCount(0);
      return;
    }


    const { count, error } = await supabase
      .from("notifications")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("user_id", user.id)
      .eq("is_read", false);


    if (error) {

      console.log(
        "Unread notification error:",
        error
      );

      return;

    }


    setUnreadCount(count ?? 0);

  }



  useEffect(() => {

    loadUnreadCount();


    const channel = supabase
      .channel("notifications-sidebar")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications"
        },
        async (payload) => {

          console.log(
            "🔔 New notification:",
            payload
          );


          await loadUnreadCount();

        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications"
        },
        async (payload) => {

          console.log(
            "🔔 Notification updated:",
            payload
          );


          await loadUnreadCount();

        }
      )
      .subscribe((status) => {

        console.log(
          "📡 Notification sidebar status:",
          status
        );

      });


    return () => {

      supabase.removeChannel(channel);

    };

  }, []);



  if (unreadCount === 0) {
    return null;
  }



  return (

    <span
      style={{
        marginLeft: "8px",
        fontSize: "11px",
        fontWeight: "bold",
        padding: "3px 7px",
        borderRadius: "10px",
        display: "inline-block"
      }}
    >
      NEW
    </span>

  );

}