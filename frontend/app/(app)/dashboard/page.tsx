"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useProject } from "@/lib/projectContext";
import { api } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, formatDate, daysUntil } from "@/lib/utils";
import { InterfaceRequest } from "@/types";
import Link from "next/link";
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import {
  FileText, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, Activity, ArrowRight, Loader2
} from "lucide-react";

const KPI_CARDS = [
  { label: "Total IRs", key: "total", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Critical", key: "critical", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { label: "Overdue", key: "overdue", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "Closed", key: "closed", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const [irs, setIrs] = useState<InterfaceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!activeProject) return;
      try {
        setIsLoading(true);
        const data = await api.get<InterfaceRequest[]>(`/interface-requests?projectId=${activeProject.id}`);
        setIrs(data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [activeProject]);

  // Derived Stats
  const overdueIRs = irs.filter(ir => ir.status !== "closed" && ir.status !== "draft" && daysUntil(ir.dueDate) < 0);
  const recentIRs = [...irs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const stats = {
    total: irs.length,
    critical: irs.filter(ir => ir.priority === "critical").length,
    overdue: overdueIRs.length,
    closed: irs.filter(ir => ir.status === "closed").length,
  };

  const projectStatusData = [
    { name: "Draft", value: irs.filter(ir => ir.status === "draft").length, color: "#94a3b8" },
    { name: "Validation", value: irs.filter(ir => ["awaiting_request_validation", "awaiting_response_validation"].includes(ir.status)).length, color: "#3b70f5" },
    { name: "Responding", value: irs.filter(ir => ir.status === "awaiting_response").length, color: "#8b5cf6" },
    { name: "Acceptance", value: irs.filter(ir => ir.status === "awaiting_response_acceptance").length, color: "#f59e0b" },
    { name: "Closed", value: irs.filter(ir => ir.status === "closed").length, color: "#10b981" },
  ];

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 opacity-50">
        <Loader2 size={48} className="animate-spin text-brand-500" />
        <p className="text-lg font-medium">Loading project dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, <span className="text-brand-500">{user?.name}</span> · {user?.company.name}</p>
        </div>
        <Link href="/ir/create" className="btn-primary">
          <FileText size={16} /> New IR
        </Link>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {KPI_CARDS.map((card) => (
          <div key={card.label} className={`card p-6 flex items-center justify-between border ${card.bg}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">{card.label}</p>
              <h2 className="text-3xl font-black">{stats[card.key as keyof typeof stats]}</h2>
            </div>
            <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>
              <card.icon size={28} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Status Breakdown Chart */}
        <div className="card xl:col-span-1 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <Activity size={18} className="text-brand-500" /> IR Status Distribution
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card xl:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <Clock size={18} className="text-brand-500" /> Recent Activity
            </h3>
            <Link href="/ir-register" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentIRs.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic">No activity recorded yet for this project.</div>
            ) : (
              recentIRs.map((ir) => (
                <Link 
                  key={ir.id} 
                  href={`/ir/${ir.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-black/5 hover:bg-brand-500/5 border border-transparent hover:border-brand-500/20 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${STATUS_COLORS[ir.status].replace('text-', 'bg-').replace('text-', 'bg-')}/10 ${STATUS_COLORS[ir.status]}`}>
                    {ir.requestorCompany.code.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate group-hover:text-brand-500 transition-colors">{ir.title}</p>
                    <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest mt-0.5">
                      {ir.irNumber} · {STATUS_LABELS[ir.status]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono opacity-40">{formatDate(ir.updatedAt)}</p>
                    <span className={`text-[10px] font-bold ${ir.priority === 'critical' ? 'text-rose-500' : 'text-gray-500'}`}>
                      {PRIORITY_LABELS[ir.priority]}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
