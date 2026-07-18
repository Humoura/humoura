"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { token, ready, login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && token) router.replace("/feed");
  }, [ready, token, router]);

  const handleLogin = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      router.push("/feed");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!email || !password || !regUsername) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      await register(regUsername, email, password);
      router.push("/feed");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!ready || token) {
    return (
      <div className="loginContainer">
        <p style={{ color: "white" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="loginContainer">
      <div className="loginBox">
        <h1 className="logo">✨ Humoura</h1>
        <p className="tagline">Where Humor Meets Connection 😊</p>
        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="inputField"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="inputField"
            />
            <button type="submit" disabled={loading} className="primaryBtn">
              {loading ? "Logging in..." : "Login"}
            </button>
            <p
              style={{
                textAlign: "center",
                marginTop: "15px",
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              className="inputField"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="inputField"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="inputField"
            />
            <button type="submit" disabled={loading} className="primaryBtn">
              {loading ? "Registering..." : "Register"}
            </button>
            <p
              style={{
                textAlign: "center",
                marginTop: "15px",
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Login
              </button>
            </p>
          </form>
        )}
        <div className="policyFooter">
          <Link href="/terms" className="policyLink">
            Terms of Service
          </Link>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
          <Link href="/guidelines" className="policyLink">
            Community Guidelines
          </Link>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
          <Link href="/privacy" className="policyLink">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
