"use client";
import { useAuth } from "@/lib/authContext";
import { useProject } from "@/lib/projectContext";
import { useState, useEffect } from "react";
import { INTERFACE_REQUESTS } from "@/lib/mockData";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, formatDate, daysUntil } from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";
import { CheckSquare, Clock, AlertTriangle, ArrowRight } from "lucide-react";

export default function MyTasksPage() {
  const { user } = useAuth();
  const { activeProject } = useProject();

  const myTasks = INTERFACE_REQUESTS.filter((ir) => {
    if (!user) return false;
    // Project filter
    if (activeProject && ir.projectId !== activeProject.id) return false;

    // Explicitly assigned to me (Delegation)
    if (ir.assignedUserId === user.id) return true;

    switch (user.role) {
      case "client":
        return ["awaiting_request_validation", "awaiting_response_validation", "awaiting_closeout", "ir_recycle"].includes(ir.status);
      case "manager":
        return (
          (ir.status === "awaiting_request_validation" && ir.requestorCompanyId === user.companyId) ||
          (ir.status === "awaiting_response" && ir.responderCompanyId === user.companyId) ||
          (ir.status === "awaiting_response_acceptance" && ir.requestorCompanyId === user.companyId)
        );
      case "user":
        return (
          (ir.status === "draft" && ir.requestorUserId === user.id) ||
          (ir.status === "awaiting_response" && ir.responderCompanyId === user.companyId)
        );
      case "admin":
        return ir.status !== "closed";
      default:
        return false;
    }
  });

  // If a real backend exists, prefer fetching real IRs for accuracy
  const [remoteTasks, setRemoteTasks] = useState<any[] | null>(null);
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const irs = await api.get<any[]>('/interface-requests');
        if (mounted) setRemoteTasks(irs);
      } catch (err) {
        // fallback to mock data
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const effectiveTasks = remoteTasks ?? INTERFACE_REQUESTS;

  const computedTasks = effectiveTasks.filter((ir) => {
    if (!user) return false;
    if (activeProject && ir.projectId !== activeProject.id) return false;
    if (ir.assignedUserId === user.id) return true;
    switch (user.role) {
      case "client":
        return ["awaiting_request_validation", "awaiting_response_validation", "awaiting_closeout", "ir_recycle"].includes(ir.status);
      case "manager":
        return (
          (ir.status === "awaiting_request_validation" && ir.requestorCompanyId === user.companyId) ||
          (ir.status === "awaiting_response" && ir.responderCompanyId === user.companyId) ||
          (ir.status === "awaiting_response_acceptance" && ir.requestorCompanyId === user.companyId)
        );
      case "user":
        return (
          (ir.status === "draft" && ir.requestorUserId === user.id) ||
          (ir.status === "awaiting_response" && ir.responderCompanyId === user.companyId)
        );
      case "admin":
        return ir.status !== "closed";
      default:
        return false;
    }
  });

  const urgent = computedTasks.filter((ir) => ir.priority === "critical" || daysUntil(ir.dueDate) <= 3);
  const normal = computedTasks.filter((ir) => !urgent.includes(ir));

  // removed old local computation; using computedTasks above

  const TaskCard = ({ ir }: { ir: typeof INTERFACE_REQUESTS[0] }) => {
    const overdue = ir.status !== "closed" && ir.status !== "draft" && daysUntil(ir.dueDate) < 0;
    const daysLeft = daysUntil(ir.dueDate);
    let action = "";
    if (user?.role === "client") {
      if (ir.status === "awaiting_request_validation") action = "Validate Request";
      if (ir.status === "awaiting_response_validation") action = "Validate Response";
      if (ir.status === "awaiting_closeout") action = "Close Out IR";
      if (ir.status === "ir_recycle") action = "Review Recycle";
    } else if (user?.role === "manager") {
      if (ir.status === "awaiting_request_validation") action = "Authorize Submission";
      if (ir.status === "awaiting_response") action = "Submit Response";
      if (ir.status === "awaiting_response_acceptance") action = "Accept / More Info";
    } else if (user?.role === "user") {
      if (ir.status === "draft") action = "Complete & Submit";
      if (ir.status === "awaiting_response") action = "Fill Response";
    } else if (user?.role === "admin") {
      action = "Monitor";
    }

    return (
      <Link href={`/ir/${ir.id}`}
        className="card flex items-start justify-between gap-4 hover:border-brand-500/40 hover:scale-[1.005] transition-all duration-200 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-xs text-brand-500">{ir.irNumber}</span>
            <span className={ir.priority === "critical" ? "badge-critical" : "badge-non-critical"}>
              {ir.priority === "critical" && <AlertTriangle size={9} />}
              {PRIORITY_LABELS[ir.priority]}
            </span>
            {ir.revision > 0 && <span className="badge-rose text-[10px]">Rev {ir.revision}</span>}
          </div>
          <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-heading)" }}>{ir.title}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{ir.requestorCompany.code} → {ir.responderCompany.code} · {ir.project.code}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={STATUS_COLORS[ir.status]}>{STATUS_LABELS[ir.status]}</span>
            <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500" : daysLeft <= 7 ? "text-amber-500" : ""}`} style={{ color: !overdue && daysLeft > 7 ? "var(--text-muted)" : undefined }}>
              <Clock size={11} />
              {ir.status === "closed" ? "Closed" : overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {action && (
            <span className="badge-blue text-[10px] whitespace-nowrap">{action}</span>
          )}
          <ArrowRight size={16} className="transition-colors" style={{ color: "var(--text-muted)" }} />
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">
          {myTasks.length} task{myTasks.length !== 1 ? "s" : ""} requiring your attention as <span className="text-brand-500 capitalize">{user?.role}</span>
          {activeProject && <> in <span className="font-bold">{activeProject.name}</span></>}
        </p>
      </div>

      {myTasks.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CheckSquare size={48} className="text-emerald-500 mb-4 opacity-60" />
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-heading)" }}>All Clear!</h3>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>No tasks require your attention in this project.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {urgent.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Urgent / Critical ({urgent.length})
              </h2>
              <div className="space-y-3">
                {urgent.map((ir) => <TaskCard key={ir.id} ir={ir} />)}
              </div>
            </div>
          )}
          {normal.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                Other Tasks ({normal.length})
              </h2>
              <div className="space-y-3">
                {normal.map((ir) => <TaskCard key={ir.id} ir={ir} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
