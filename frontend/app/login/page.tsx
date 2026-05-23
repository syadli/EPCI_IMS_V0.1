"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { Eye, EyeOff, AlertCircle, Layers, Shield, Activity, Sun, Moon } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Super User",        email: "superuser@epci-ims.com",      password: "super123",   color: "text-purple-500" },
  { label: "Project Admin",     email: "padmin@epci-ims.com",         password: "admin123",   color: "text-blue-500" },
  { label: "Manager (KON1)",    email: "manager.kon1@epci-ims.com",  password: "manager123", color: "text-cyan-500" },
  { label: "Client",            email: "client@epci-ims.com",        password: "client123",  color: "text-amber-500" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const ok = await login(email, password);
    setLoading(false);
    if (ok) router.push("/dashboard");
    else setError("Invalid credentials. Try a demo account below.");
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email); setPassword(acc.password); setError("");
  };

  return (
    <div className="min-h-screen flex relative" style={{ background: "var(--bg-base)" }}>
      {/* Theme toggle — fixed top-right */}
      <button
        id="theme-toggle-login"
        onClick={toggleTheme}
        className="theme-toggle absolute top-4 right-4 z-10"
        title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
      >
        {theme === "dark"
          ? <><Sun size={14} className="text-amber-400" /> Light</>
          : <><Moon size={14} className="text-brand-500" /> Dark</>}
      </button>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
        style={{ background: theme === "dark" ? "linear-gradient(135deg, #080c18 0%, #0d1327 100%)" : "linear-gradient(135deg, #dde6ff 0%, #eef2ff 100%)" }}>
        {/* Decorative glow */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(circle at 30% 50%, #3b70f5 0%, transparent 60%)" }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#3b70f5", filter: "blur(80px)" }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Layers size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text-heading)" }}>EPCI IMS</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight" style={{ color: "var(--text-heading)" }}>
              Interface<br />
              <span style={{ background: "linear-gradient(90deg, #3b70f5, #7c9fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Management
              </span><br />
              System
            </h1>
            <p className="mt-4 text-lg max-w-md" style={{ color: "var(--text-secondary)" }}>
              Streamline contractor interface requests on large-scale EPCI projects with full workflow tracking and Client validation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield,   label: "RBAC Security",   desc: "4-role access control" },
              { icon: Activity, label: "SLA Monitoring",  desc: "Real-time breach alerts" },
              { icon: Layers,   label: "7-Step Workflow", desc: "Full audit trail" },
              { icon: Activity, label: "Multi-Company",   desc: "Cross-contractor IRs" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card p-4">
                <Icon size={16} className="text-brand-500 mb-2" />
                <div className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>{label}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs" style={{ color: "var(--text-muted)" }}>
          © 2026 EPCI Interface Management System · Enterprise Edition
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Layers size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text-heading)" }}>EPCI IMS</span>
          </div>

          <div className="card-glass p-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-heading)" }}>Sign In</h2>
            <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>Enter your credentials to access the system.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="you@company.com"
                  required autoComplete="email" />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input id="password" type={showPw ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10" placeholder="••••••••"
                    required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--text-muted)" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button id="login-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center btn-lg">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Sign In"}
              </button>
            </form>

            <div className="glow-divider" />

            <div>
              <p className="text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                Demo Accounts
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    id={`demo-${acc.label.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => fillDemo(acc)}
                    className="btn-secondary py-2 px-3 text-xs flex-col items-start gap-0.5 h-auto"
                  >
                    <span className={`font-semibold ${acc.color}`}>{acc.label}</span>
                    <span className="text-[10px] truncate w-full" style={{ color: "var(--text-muted)" }}>{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
