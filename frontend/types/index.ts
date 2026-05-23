export type UserRole = "super_user" | "project_admin" | "admin" | "manager" | "user" | "client";

export type IRStatus =
  | "draft"
  | "awaiting_request_validation"
  | "awaiting_response"
  | "awaiting_response_validation"
  | "awaiting_response_acceptance"
  | "awaiting_closeout"
  | "ir_recycle"
  | "closed";

export type IRPriority = "critical" | "non_critical";

export interface Company {
  id: string;
  name: string;
  code: string;
  type: "contractor" | "client";
}

export interface Project {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  companyIds?: string[];
  projectAdminIds?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  company: Company;
  projectIds: string[];
  isActive: boolean;
  avatarInitials: string;
}

export interface Attachment {
  id: string;
  irId: string;
  filename: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  type: "request" | "response";
}

export interface WorkflowLog {
  id: string;
  irId: string;
  step: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  comment?: string;
  timestamp: string;
}

export interface IRResponse {
  id: string;
  irId: string;
  content: string;
  submittedBy: string;
  submittedAt: string;
  attachments: Attachment[];
}

export interface InterfaceRequest {
  id: string;
  irNumber: string;
  title: string;
  description: string;
  priority: IRPriority;
  status: IRStatus;
  requestorCompanyId: string;
  requestorCompany: Company;
  responderCompanyId: string;
  responderCompany: Company;
  requestorUserId: string;
  requestorUser: User;
  projectId: string;
  project: Project;
  dueDate: string;
  revision: number;
  response?: IRResponse;
  workflowLogs: WorkflowLog[];
  attachments: Attachment[];
  assignedUserId?: string;
  closeOutDate?: string;
  closeOutComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  irId: string;
  irNumber: string;
  link?: string;
  type: "ir_submitted" | "ir_approved" | "ir_rejected" | "response_submitted" | "response_approved" | "response_rejected" | "closeout" | "sla_warning" | "sla_overdue" | "recycle_approved" | "message" | "workflow_update";
  message: string;
  isRead: boolean;
  createdAt: string;
} 

export interface SLAConfig {
  id: string;
  projectId: string;
  priority: IRPriority;
  daysRequestValidation: number;
  daysResponse: number;
  daysResponseValidation: number;
  daysCloseOut: number;
}

export interface KPISummary {
  total: number;
  draft: number;
  awaitingRequestValidation: number;
  awaitingResponse: number;
  awaitingResponseValidation: number;
  awaitingResponseAcceptance: number;
  awaitingCloseOut: number;
  irRecycle: number;
  closed: number;
  overdue: number;
  slaCompliance: number;
  critical: number;
  nonCritical: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}
