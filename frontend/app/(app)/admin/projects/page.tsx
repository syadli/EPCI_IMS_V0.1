"use client";
import { useState, useMemo } from "react";
import { PROJECTS, COMPANIES, USERS } from "@/lib/mockData";
import { useAuth } from "@/lib/authContext";
import { Globe, Plus, Search, Building2, Users, Edit2, CheckCircle2, XCircle, Settings2 } from "lucide-react";
import Link from "next/link";
import { Project } from "@/types";

export default function SuperAdminProjectsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Guard: Only super_user can access this
  if (user?.role !== "super_user" && user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm opacity-50">Only Super Users can access global project configuration.</p>
        <Link href="/dashboard" className="btn-primary mt-6">Return to Dashboard</Link>
      </div>
    );
  }

  const filteredProjects = PROJECTS.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Global Project Management</h1>
          <p className="page-subtitle">Configure projects, participating contractors, and global access.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={16} /> Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <Globe size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{PROJECTS.length}</div>
            <div className="text-xs opacity-50 uppercase font-bold tracking-wider">Total Projects</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{PROJECTS.filter(p => p.isActive).length}</div>
            <div className="text-xs opacity-50 uppercase font-bold tracking-wider">Active Projects</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{COMPANIES.length}</div>
            <div className="text-xs opacity-50 uppercase font-bold tracking-wider">Total Companies</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            type="text" 
            className="input pl-10" 
            placeholder="Search projects by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="card group hover:border-brand-500/40 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xl">
                  {project.code.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-brand-500 transition-colors">{project.name}</h3>
                  <div className="flex items-center gap-2 text-xs opacity-50">
                    <span className="font-mono">{project.code}</span>
                    <span>•</span>
                    <span className={project.isActive ? "text-emerald-500" : "text-rose-500"}>
                      {project.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <button className="btn-icon">
                <Settings2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-black/5 border border-dashed" style={{ borderColor: "var(--border)" }}>
                <div className="text-[10px] uppercase font-bold opacity-40 mb-1 flex items-center gap-1">
                  <Building2 size={10} /> Involved Companies
                </div>
                <div className="text-sm font-semibold">{project.companyIds?.length || 4} Companies</div>
              </div>
              <div className="p-3 rounded-lg bg-black/5 border border-dashed" style={{ borderColor: "var(--border)" }}>
                <div className="text-[10px] uppercase font-bold opacity-40 mb-1 flex items-center gap-1">
                  <Users size={10} /> Project Admins
                </div>
                <div className="text-sm font-semibold">{project.projectAdminIds?.length || 2} Admins</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex -space-x-2">
                {USERS.filter(u => u.projectIds.includes(project.id)).slice(0, 5).map(u => (
                  <div key={u.id} title={u.name} className="w-7 h-7 rounded-full bg-brand-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white cursor-help">
                    {u.avatarInitials}
                  </div>
                ))}
                {USERS.filter(u => u.projectIds.includes(project.id)).length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white">
                    +{USERS.filter(u => u.projectIds.includes(project.id)).length - 5}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/projects/${project.id}/users`} className="btn-secondary btn-xs">
                  Manage Users
                </Link>
                <Link href={`/admin/projects/${project.id}`} className="btn-primary btn-xs">
                  Configure Project
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShieldAlert({ size, className }: any) {
  return <XCircle size={size} className={className} />;
}
