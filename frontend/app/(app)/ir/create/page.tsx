"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useProject } from "@/lib/projectContext";
import { api } from "@/lib/api";
import { ArrowLeft, Paperclip, X, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

export default function CreateIRPage() {
  const { user } = useAuth();
  const { activeProject, availableProjects } = useProject();
  const router = useRouter();

  const today = new Date();
  const defaultDue = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: "",
    description: "",
    responderCompanyId: "",
    projectId: activeProject?.id || (user?.projectIds[0] ?? ""),
    priority: "non_critical" as "critical" | "non_critical",
    dueDate: defaultDue,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const data = await api.get<any[]>("/companies");
        setCompanies(data);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    }
    fetchCompanies();
  }, []);

  const contractors = companies.filter((c) => c.id !== user?.companyId && c.type === "contractor");
  const userProjects = availableProjects;

  const selectedResponder = companies.find((c) => c.id === form.responderCompanyId);
  const previewIRNumber = selectedResponder
    ? `IR-${user?.company.code}-${selectedResponder.code}-XXXX`
    : "IR-???-???-XXXX";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((f) => [...f, ...Array.from(e.target.files!)]);
  };

  const removeFile = (i: number) => setFiles((f) => f.filter((_, idx) => idx !== i));

  const handleSave = async (submit: boolean) => {
    try {
      if (submit) { setSubmitting(true); }
      else { setSaving(true); }
      
      const payload = {
        ...form,
        status: submit ? "awaiting_request_validation" : "draft",
      };

      await api.post("/interface-requests", payload);
      
      router.push("/ir-register");
    } catch (error) {
      console.error("Failed to save IR:", error);
      alert("Failed to save IR. Please try again.");
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-icon"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">Create Interface Request</h1>
          <p className="page-subtitle font-mono text-brand-500 text-xs">{previewIRNumber}</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-600/10 border border-brand-500/20 text-sm" style={{ color: "var(--text-secondary)" }}>
        <Info size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
        <div>The IR number will be auto-generated upon submission. Default due date is <strong style={{ color: "var(--text-heading)" }}>14 days</strong> from today.
        You can save as Draft or submit directly for Manager approval.</div>
      </div>

      <div className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project */}
          <div>
            <label className="label" htmlFor="project-select">Project *</label>
            <select id="project-select" className="select" value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">Select Project</option>
              {userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Responder */}
          <div>
            <label className="label" htmlFor="responder-select">Responder Company *</label>
            <select id="responder-select" className="select" value={form.responderCompanyId}
              onChange={(e) => setForm({ ...form, responderCompanyId: e.target.value })}>
              <option value="">Select Responder</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="label">Priority *</label>
            <div className="flex gap-3">
              {(["non_critical", "critical"] as const).map((p) => (
                <label key={p} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${form.priority === p ? (p === "critical" ? "border-red-500/50 bg-red-500/10" : "border-brand-500/50 bg-brand-500/10") : "border-gray-200 dark:border-gray-800 hover:border-brand-500/35"}`}>
                  <input type="radio" name="priority" value={p} checked={form.priority === p}
                    onChange={() => setForm({ ...form, priority: p })} className="hidden" />
                  {p === "critical" && <AlertTriangle size={14} className="text-red-500" />}
                  <span className={`text-sm font-medium ${form.priority === p ? (p === "critical" ? "text-red-500" : "text-brand-500") : ""}`} style={{ color: form.priority !== p ? "var(--text-muted)" : undefined }}>
                    {p === "critical" ? "Critical" : "Non-Critical"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="label" htmlFor="due-date">Due Date *</label>
            <input id="due-date" type="date" className="input" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="label" htmlFor="ir-title">Title *</label>
          <input id="ir-title" className="input" placeholder="Brief title describing the interface request…"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="ir-description">Description *</label>
          <textarea id="ir-description" className="textarea h-36"
            placeholder="Provide detailed description of the interface request, data required, and any specific requirements…"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        {/* Attachments */}
        <div>
          <label className="label">Attachments</label>
          <label htmlFor="file-upload"
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all hover:bg-brand-500/5" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <Paperclip size={20} />
            <span className="text-sm">Drop files here or <span className="text-brand-500">click to upload</span></span>
            <span className="text-xs">PDF, DWG, XLSX, DOC — max 50 MB each</span>
            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFile} />
          </label>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#111624] border border-[rgba(99,120,255,0.12)]">
                  <div className="flex items-center gap-2 text-sm text-[#c0c8e8]">
                    <Paperclip size={14} className="text-brand-400" />
                    {f.name}
                    <span className="text-xs text-[#4a5568]">({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="btn-icon text-rose-500 hover:bg-rose-500/10">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/ir-register" className="btn-secondary">Cancel</Link>
        <div className="flex gap-3">
          <button id="save-draft-btn" className="btn-secondary" onClick={() => handleSave(false)} disabled={saving || submitting}>
            {saving ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
            Save as Draft
          </button>
          <button id="submit-ir-btn" className="btn-primary" onClick={() => handleSave(true)}
            disabled={!form.title || !form.responderCompanyId || !form.projectId || saving || submitting}>
            {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}
