"use client";
import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useProject } from "@/lib/projectContext";
import { USERS, COMPANIES } from "@/lib/mockData";
import { User, UserRole } from "@/types";
import { ROLE_LABELS } from "@/lib/utils";
import { UserPlus, Search, Edit2, Trash2, Shield, CheckCircle2, XCircle } from "lucide-react";

const ROLE_BADGE: Record<UserRole, string> = {
  super_user: "badge-purple",
  project_admin: "badge-blue",
  admin: "badge-purple",
  manager: "badge-blue",
  user: "badge-gray",
  client: "badge-orange",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [showModal, setShowModal] = useState(false);

  const filtered = USERS.filter((u) => {
    // 1. Context Scoping: If Project Admin, only show users in their active project
    if (user?.role === "project_admin" && activeProject) {
      if (!u.projectIds.includes(activeProject.id)) return false;
    }

    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company.code.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            {user?.role === "project_admin" ? (
              <>Managing users for <span className="font-bold text-brand-500">{activeProject?.name}</span></>
            ) : (
              <>{USERS.length} users across {COMPANIES.length} companies</>
            )}
          </p>
        </div>
        <button id="add-user-btn" onClick={() => setShowModal(true)} className="btn-primary">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {(["super_user", "project_admin", "admin", "manager", "user", "client"] as UserRole[]).map((r) => (
          <div key={r} className="card p-4 flex flex-col gap-1">
            <div className="text-xl font-bold">{filtered.filter(u => u.role === r).length}</div>
            <div className="text-[10px] uppercase font-bold opacity-40">{ROLE_LABELS[r]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
          <input id="user-search" className="input pl-9" placeholder="Search name, email, company…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select id="role-filter" className="select w-40" value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}>
          <option value="">All Roles</option>
          {(["super_user", "project_admin", "admin", "manager", "user", "client"] as UserRole[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Company</th>
              <th>Projects</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-700/50 flex items-center justify-center text-xs font-bold text-brand-300">
                      {u.avatarInitials}
                    </div>
                    <span className="font-medium text-white">{u.name}</span>
                  </div>
                </td>
                <td className="text-xs text-[#8892b0]">{u.email}</td>
                <td><span className={ROLE_BADGE[u.role]}>{ROLE_LABELS[u.role]}</span></td>
                <td>
                  <div>
                    <div className="text-sm text-white">{u.company.name}</div>
                    <div className="text-[10px] text-[#4a5568]">{u.company.code}</div>
                  </div>
                </td>
                <td className="text-xs text-[#8892b0]">{u.projectIds.length} project{u.projectIds.length !== 1 ? "s" : ""}</td>
                <td>
                  {u.isActive
                    ? <span className="badge-green"><CheckCircle2 size={10} /> Active</span>
                    : <span className="badge-red"><XCircle size={10} /> Inactive</span>}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-icon" title="Edit"><Edit2 size={14} /></button>
                    <button className="btn-icon text-rose-500 hover:bg-rose-500/10" title="Deactivate"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-glass w-full max-w-md p-8 animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-6">Add New User</h2>
            <div className="space-y-4">
              <div><label className="label">Full Name</label><input className="input" placeholder="Ahmad Rizky" /></div>
              <div><label className="label">Email</label><input type="email" className="input" placeholder="user@company.com" /></div>
              <div>
                <label className="label">Role</label>
                <select className="select">
                  {(["super_user", "project_admin", "admin", "manager", "user", "client"] as UserRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Company</label>
                <select className="select">
                  {COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div><label className="label">Temporary Password</label><input type="password" className="input" placeholder="••••••••" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => { alert("User created! (mock)"); setShowModal(false); }}>Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
