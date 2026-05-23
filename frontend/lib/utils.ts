import { IRStatus, IRPriority, UserRole } from "@/types";

export const STATUS_LABELS: Record<IRStatus, string> = {
  draft: "Draft",
  awaiting_request_validation: "Awaiting Request Validation",
  awaiting_response: "Awaiting Response",
  awaiting_response_validation: "Awaiting Response Validation",
  awaiting_response_acceptance: "Awaiting Response Acceptance",
  awaiting_closeout: "Awaiting Close Out",
  ir_recycle: "IR Recycle",
  closed: "Closed",
};

export const STATUS_COLORS: Record<IRStatus, string> = {
  draft: "badge-gray",
  awaiting_request_validation: "badge-yellow",
  awaiting_response: "badge-blue",
  awaiting_response_validation: "badge-purple",
  awaiting_response_acceptance: "badge-indigo",
  awaiting_closeout: "badge-orange",
  ir_recycle: "badge-rose",
  closed: "badge-green",
};

export const PRIORITY_LABELS: Record<IRPriority, string> = {
  critical: "Critical",
  non_critical: "Non-Critical",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_user: "Super User",
  project_admin: "Project Admin",
  admin: "Administrator",
  manager: "Manager",
  user: "Regular User",
  client: "Client",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  const due = new Date(dateStr);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateStr: string, status: IRStatus): boolean {
  if (status === "closed" || status === "draft") return false;
  return daysUntil(dateStr) < 0;
}

export function getKPISummary() {
  // Computed from mock data inline to avoid circular import
  return {
    total: 7, draft: 1, awaitingRequestValidation: 1,
    awaitingResponse: 1, awaitingResponseValidation: 1,
    awaitingResponseAcceptance: 0, awaitingCloseOut: 1,
    irRecycle: 1, closed: 1, overdue: 2,
    slaCompliance: 72, critical: 5, nonCritical: 2,
  };
}

export const CHART_STATUS_DATA = [
  { name: "Draft", value: 1, color: "#6b7280" },
  { name: "Req. Validation", value: 1, color: "#f59e0b" },
  { name: "Awaiting Response", value: 1, color: "#3b82f6" },
  { name: "Resp. Validation", value: 1, color: "#8b5cf6" },
  { name: "Resp. Acceptance", value: 0, color: "#6366f1" },
  { name: "Close Out", value: 1, color: "#f97316" },
  { name: "IR Recycle", value: 1, color: "#f43f5e" },
  { name: "Closed", value: 1, color: "#10b981" },
];

export const CHART_MONTHLY_DATA = [
  { month: "Jan", submitted: 3, closed: 2 },
  { month: "Feb", submitted: 5, closed: 3 },
  { month: "Mar", submitted: 4, closed: 4 },
  { month: "Apr", submitted: 8, closed: 5 },
  { month: "May", submitted: 6, closed: 1 },
];
