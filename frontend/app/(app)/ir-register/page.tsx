"use client";
import { useState, useMemo, useEffect } from "react";
import { useProject } from "@/lib/projectContext";
import { api } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, formatDate, daysUntil } from "@/lib/utils";
import { IRStatus, IRPriority, InterfaceRequest } from "@/types";
import Link from "next/link";
import { Search, Filter, Download, Plus, ChevronUp, ChevronDown, ArrowUpDown, Loader2 } from "lucide-react";
import { exportIRRegisterToExcel } from "@/lib/exportHelpers";

const ALL_STATUSES: IRStatus[] = [
  "draft", "awaiting_request_validation", "awaiting_response",
  "awaiting_response_validation", "awaiting_response_acceptance",
  "awaiting_closeout", "ir_recycle", "closed",
];

type SortKey = "irNumber" | "title" | "priority" | "status" | "dueDate" | "updatedAt";

export default function IRRegisterPage() {
  const { activeProject } = useProject();
  
  const [irs, setIrs] = useState<InterfaceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IRStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<IRPriority | "">("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchIRs() {
      if (!activeProject) return;
      
      try {
        setIsLoading(true);
        
        // Membangun query params untuk server-side filtering, searching, dan sorting
        const queryParams = new URLSearchParams({
          projectId: activeProject.id,
          search: search,
          status: statusFilter,
          priority: priorityFilter,
          sortBy: sortKey,
          sortDir: sortDir,
        });

        const data = await api.get<InterfaceRequest[]>(`/interface-requests?${queryParams.toString()}`);
        setIrs(data);
      } catch (error) {
        console.error("Failed to fetch IRs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Debounce 300ms untuk input pencarian agar tidak membebani database PostgreSQL secara agresif
    const delayDebounce = setTimeout(() => {
      fetchIRs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [activeProject, search, statusFilter, priorityFilter, sortKey, sortDir]);

  // Data sudah di-filter dan di-sort dari sisi backend/database PostgreSQL
  const sortedIRs = useMemo(() => {
    return irs;
  }, [irs]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortButton = ({ k, label }: { k: SortKey, label: string }) => (
    <button 
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 hover:text-brand-500 transition-colors"
    >
      {label}
      {sortKey === k ? (
        sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      ) : (
        <ArrowUpDown size={12} className="opacity-30" />
      )}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">IR Register</h1>
          <p className="page-subtitle">
            {activeProject ? (
              <><span className="font-bold text-brand-500">{activeProject.name}</span> • </>
            ) : null}
            {isLoading ? "Loading..." : `${sortedIRs.length} Interface Requests`}
          </p>
        </div>
        <Link href="/ir/create" className="btn-primary">
          <Plus size={16} /> New IR
        </Link>
      </div>

      {/* Filters Panel */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            type="text" 
            className="input pl-10" 
            placeholder="Search by ID, title, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className="select w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IRStatus | "")}
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select 
          className="select w-44"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as IRPriority | "")}
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="non_critical">Non-Critical</option>
        </select>

        <button
          className="btn-secondary"
          onClick={() => exportIRRegisterToExcel(sortedIRs)}
          disabled={isLoading || sortedIRs.length === 0}
        >
          <Download size={16} /> Download Excel
        </button>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 border-b" style={{ borderColor: "var(--border)" }}>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider opacity-50">
                  <SortButton k="irNumber" label="ID" />
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider opacity-50">
                  <SortButton k="title" label="Title" />
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider opacity-50">
                  Companies
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">
                  <SortButton k="priority" label="Priority" />
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider opacity-50">
                  <SortButton k="status" label="Status" />
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider opacity-50">
                  <SortButton k="dueDate" label="Due Date" />
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider opacity-50">
                  <SortButton k="updatedAt" label="Last Update" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-50">
                      <Loader2 size={32} className="animate-spin text-brand-500" />
                      <p>Fetching interface requests...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedIRs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center">
                    <div className="opacity-50">
                      <Search size={48} className="mx-auto mb-4" />
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-sm">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedIRs.map((ir) => {
                  const days = daysUntil(ir.dueDate);
                  return (
                    <tr 
                      key={ir.id} 
                      className="hover:bg-brand-500/5 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/ir/${ir.id}`}
                    >
                      <td className="px-4 py-4 font-mono text-xs font-bold text-brand-500">
                        {ir.irNumber}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-sm group-hover:text-brand-500 transition-colors truncate max-w-[250px]">
                          {ir.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold opacity-60">{ir.requestorCompany?.code || "N/A"}</span>
                          <span className="opacity-30">→</span>
                          <span className="font-bold opacity-60">{ir.responderCompany?.code || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`badge ${ir.priority === "critical" ? "badge-red" : "badge-gray"}`}>
                          {PRIORITY_LABELS[ir.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`status-dot ${STATUS_COLORS[ir.status]}`}>
                          {STATUS_LABELS[ir.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium">
                        <div className={days < 0 ? "text-rose-500 font-bold" : days <= 3 ? "text-amber-500 font-bold" : ""}>
                          {formatDate(ir.dueDate)}
                        </div>
                        <div className="text-[10px] opacity-40 mt-0.5">
                          {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days remaining`}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[10px] opacity-40 font-mono">
                        {formatDate(ir.updatedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}