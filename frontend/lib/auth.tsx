"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { LoginResponse } from "./types";

interface AuthState {
  token: string;
  userId: string;
  username: string;
  isAdmin: boolean;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persist(data: {
  token: string;
  username: string;
  userId: string;
  isAdmin: boolean;
}) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  localStorage.setItem("userId", data.userId);
  localStorage.setItem("isAdmin", String(data.isAdmin));
}

function clearPersist() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("userId");
  localStorage.removeItem("isAdmin");
}

function applyLogin(
  setState: (s: AuthState) => void,
  res: LoginResponse
) {
  const next = {
    token: res.token,
    username: res.user.username,
    userId: res.user.id,
    isAdmin: Boolean(res.user.isAdmin),
    ready: true,
  };
  persist(next);
  setState(next);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: "",
    userId: "",
    username: "",
    isAdmin: false,
    ready: false,
  });

  useEffect(() => {
    setState({
      token: localStorage.getItem("token") || "",
      userId: localStorage.getItem("userId") || "",
      username: localStorage.getItem("username") || "",
      isAdmin: localStorage.getItem("isAdmin") === "true",
      ready: true,
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    });
    applyLogin(setState, res.data);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await api.post("/api/auth/register", { username, email, password });
      const res = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });
      applyLogin(setState, res.data);
    },
    []
  );

  const logout = useCallback(() => {
    clearPersist();
    setState({
      token: "",
      userId: "",
      username: "",
      isAdmin: false,
      ready: true,
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
