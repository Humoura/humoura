"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !token) {
      router.replace("/login");
    }
  }, [ready, token, router]);

  if (!ready) {
    return (
      <div className="loginContainer">
        <p style={{ color: "white" }}>Loading...</p>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="appContainer">
      <Sidebar />
      <main className="mainContent">{children}</main>
    </div>
  );
}
