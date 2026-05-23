"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { User, UserRole } from "@/types";
import { api } from "./api";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("epci_token");
    const savedUser = localStorage.getItem("epci_user");
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    try {
      const response = await api.post<{ access_token: string; user: User }>("/auth/login", { email, password: pass });
      
      setUser(response.user);
      localStorage.setItem("epci_token", response.access_token);
      localStorage.setItem("epci_user", JSON.stringify(response.user));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("epci_token");
    localStorage.removeItem("epci_user");
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    // In a real app, this might involve an API call to refresh the token with a new role
    // For now, we'll just log the intent as role switching is handled by the backend's user data
    console.log("Switching role to:", role);
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
