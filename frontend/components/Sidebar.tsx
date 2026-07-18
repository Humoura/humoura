"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, authHeaders } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Notification } from "@/lib/types";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, isAdmin, logout } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get("/api/notifications", {
          headers: authHeaders(token),
        });
        const notifications: Notification[] = res.data.notifications || [];
        setUnread(notifications.filter((n) => !n.isRead).length);
      } catch {
        /* ignore */
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const items = [
    { href: "/feed", label: "Feed", icon: "📱" },
    { href: "/messages", label: "Messages", icon: "💬" },
    { href: "/vines", label: "Vines", icon: "🎬" },
    { href: "/notifications", label: "Notifications", icon: "🔔" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <aside className="sidebar">
      <h1 className="logo">✨ Humoura</h1>
      <nav className="navMenu">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`navItem ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
            style={
              item.href === "/notifications"
                ? { position: "relative" }
                : undefined
            }
          >
            {item.icon} {item.label}
            {item.href === "/notifications" && unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  background: "#e74c3c",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {unread}
              </span>
            )}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={`navItem ${pathname === "/admin" ? "active" : ""}`}
          >
            👑 Admin
          </Link>
        )}
      </nav>
      <button onClick={handleLogout} className="logoutBtn">
        Logout
      </button>
    </aside>
  );
}
