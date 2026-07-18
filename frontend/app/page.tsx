"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { token, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(token ? "/feed" : "/login");
  }, [ready, token, router]);

  return (
    <div className="loginContainer">
      <p style={{ color: "white" }}>Loading...</p>
    </div>
  );
}
