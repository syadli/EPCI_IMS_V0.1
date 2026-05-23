"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { api } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, formatDate, formatDateTime, formatFileSize, daysUntil } from "@/lib/utils";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/lib/authContext";
import { IRStatus, IRPriority, User, InterfaceRequest } from "@/types";
import Link from "next/link";
import { downloadIRSummaryPdf } from "@/lib/exportHelpers";
import {
  ArrowLeft, FileText, Paperclip, Clock, CheckCircle2,
  XCircle, RotateCcw, AlertTriangle, User2, Building2,
  Calendar, Hash, Download, Send, ChevronRight, MessageSquare,
  Users, UserPlus, ShieldAlert, Info, Loader2, Search
} from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  "Submission": <Send size={12} />,
  "Manager Authorization": <CheckCircle2 size={12} />,
  "Request Validation": <CheckCircle2 size={12} />,
  "Response": <FileText size={12} />,
  "Response Validation": <CheckCircle2 size={12} />,
  "Response Acceptance": <CheckCircle2 size={12} />,
  "IR Recycle": <RotateCcw size={12} />,
  "Close Out": <CheckCircle2 size={12} />,
  "Delegation": <Users size={12} />,
  "Technical Input": <UserPlus size={12} />,
};

export default function IRDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  
  const [ir, setIr] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionComment, setActionComment] = useState("");
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [delegateType, setDelegateType] = useState<"delegation" | "input">("delegation");
  const [searchUser, setSearchUser] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchIR() {
      try {
        setIsLoading(true);
        const data = await api.get<any>(`/interface-requests/${id}`);
        setIr(data);
        
        // Fetch users for delegation if needed
        const usersData = await api.get<User[]>("/users"); // Ideally this should be filtered by project/company in backend
        setAvailableUsers(usersData.filter(u => u.id !== user?.id && u.companyId === user?.companyId));
      } catch (error) {
        console.error("Failed to fetch IR:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIR();
  }, [id, user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleWorkflowUpdate = (payload: { irId: string }) => {
      if (payload.irId !== id) return;
      api.get<any>(`/interface-requests/${id}`)
        .then((data) => setIr(data))
        .catch((error) => console.error('Failed to refresh IR after workflow update:', error));
    };

    socket.on('workflow:update', handleWorkflowUpdate);
    return () => {
      socket.off('workflow:update', handleWorkflowUpdate);
    };
  }, [id]);

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 opacity-50">
      <Loader2 size={48} className="animate-spin text-brand-500" />
      <p>Loading IR details...</p>
    </div>
  );

  if (!ir) return (
    <div className="flex flex-col items-center justify-center h-64 text-[#8892b0]">
      <FileText size={40} className="mb-3 opacity-40" />
      <p>Interface Request not found.</p>
      <Link href="/ir-register" className="btn-secondary btn-sm mt-3">Back to Register</Link>
    </div>
  );

  const overdue = ir.status !== "closed" && ir.status !== "draft" && daysUntil(ir.dueDate) < 0;
  const daysLeft = daysUntil(ir.dueDate);

  // Determine available actions per role & status
  const isAssignedToMe = ir.assignedUserId === user?.id;
  const canClientApproveRequest = user?.role === "client" && ir.status === "awaiting_request_validation";
  const canManagerAuthorize = user?.role === "manager" && ir.status === "awaiting_request_validation" && user?.companyId === ir.requestorCompanyId;
  const canRespond = (user?.role === "user" || user?.role === "manager") && ir.status === "awaiting_response" && user?.companyId === ir.responderCompanyId;
  const canClientApproveResponse = user?.role === "client" && ir.status === "awaiting_response_validation";
  const canRequestorAccept = (user?.role === "manager" || user?.role === "user") && ir.status === "awaiting_response_acceptance" && user?.companyId === ir.requestorCompanyId;
  const canClientCloseOut = user?.role === "client" && ir.status === "awaiting_closeout";

  const hasAuthority = isAssignedToMe || canClientApproveRequest || canManagerAuthorize || canRespond || canClientApproveResponse || canRequestorAccept || canClientCloseOut;
  const hasActions = hasAuthority && ir.status !== "closed" && ir.status !== "draft";

  const updateIRStatus = async (newStatus: IRStatus, comment: string, assignedUserId?: string) => {
    try {
      const updated = await api.put<any>(`/interface-requests/${ir.id}/status`, {
        status: newStatus,
        comment,
        assignedUserId
      });
      setIr(updated);
      setActionComment("");
      setShowActionPanel(false);
      setShowDelegateModal(false);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleResponse = async (content: string) => {
    try {
      const updated = await api.post<any>(`/interface-requests/${ir.id}/response`, { content });
      setIr(updated);
      setShowActionPanel(false);
    } catch (error) {
      alert("Failed to submit response");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header & Actions Header */}
      <div>
        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          <Link href="/ir-register" className="hover:text-brand-500 transition-colors">IR Register</Link>
          <ChevronRight size={12} />
          <span className="font-mono opacity-70">{ir.irNumber}</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`badge ${ir.priority === "critical" ? "badge-red" : "badge-gray"}`}>
                {PRIORITY_LABELS[ir.priority as IRPriority]}
              </span>
              <span className={`status-dot ${STATUS_COLORS[ir.status as IRStatus]}`}>
                {STATUS_LABELS[ir.status as IRStatus]}
              </span>
            </div>
            <h1 className="text-2xl font-black mb-1">{ir.title}</h1>
            <div className="flex items-center gap-4 text-xs opacity-50">
              <span className="flex items-center gap-1"><Building2 size={12} /> {ir.project.name}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> Updated {formatDateTime(ir.updatedAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadIRSummaryPdf(ir)}
              className="btn-secondary btn-sm"
            ><Download size={14} /> Download PDF Summary</button>
            {hasActions && (
              <button 
                onClick={() => setShowActionPanel(!showActionPanel)} 
                className="btn-primary btn-sm px-6"
              >
                {showActionPanel ? "Close Actions" : "Take Action"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Action Panel */}
          {showActionPanel && (
            <div className="card border-brand-500/30 bg-brand-500/5 p-6 animate-slide-up">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-brand-500" /> Action Required
              </h3>
              
              <div className="space-y-4">
                {ir.status === "awaiting_response" ? (
                  <div>
                    <label className="label">Your Response</label>
                    <textarea 
                      className="input min-h-[120px] mb-4" 
                      placeholder="Type your technical response here..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                    ></textarea>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleResponse(actionComment)}
                        className="btn-primary"
                        disabled={!actionComment}
                      >Submit Response</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="label">Comments / Remarks</label>
                    <textarea 
                      className="input min-h-[100px] mb-4" 
                      placeholder="Optional comments for this action..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                    ></textarea>
                    <div className="flex flex-wrap gap-3">
                      {ir.status === "awaiting_request_validation" && (
                        <>
                          <button onClick={() => updateIRStatus("awaiting_response", actionComment)} className="btn-primary">Approve & Send to Responder</button>
                          <button onClick={() => updateIRStatus("draft", actionComment)} className="btn-secondary text-rose-500 hover:bg-rose-500/10">Reject to Draft</button>
                        </>
                      )}
                      {ir.status === "awaiting_response_validation" && (
                        <>
                          <button onClick={() => updateIRStatus("awaiting_response_acceptance", actionComment)} className="btn-primary">Verify & Send to Requestor</button>
                          <button onClick={() => updateIRStatus("awaiting_response", actionComment)} className="btn-secondary text-rose-500">Request Revision</button>
                        </>
                      )}
                      {ir.status === "awaiting_response_acceptance" && (
                        <>
                          <button onClick={() => updateIRStatus("awaiting_closeout", actionComment)} className="btn-primary">Accept Response</button>
                          <button onClick={() => updateIRStatus("ir_recycle", actionComment)} className="btn-secondary text-amber-500">Request More Info</button>
                        </>
                      )}
                      {ir.status === "awaiting_closeout" && (
                        <button onClick={() => updateIRStatus("closed", actionComment)} className="btn-primary bg-emerald-600 hover:bg-emerald-700">Official Close Out</button>
                      )}

                      <div className="h-8 w-px bg-white/10 mx-2" />
                      
                      <button 
                        onClick={() => { setDelegateType("delegation"); setShowDelegateModal(true); }}
                        className="btn-secondary"
                      ><Users size={14} /> Delegate</button>
                      
                      <button 
                        onClick={() => { setDelegateType("input"); setShowDelegateModal(true); }}
                        className="btn-secondary"
                      ><UserPlus size={14} /> Request Input</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="card p-6">
            <h3 className="section-title mb-6 flex items-center gap-2">
              <Info size={18} className="text-brand-500" /> Request Details
            </h3>
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{ir.description}</p>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-widest opacity-30 mb-4">Attachments ({ir.attachments.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ir.attachments.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 border hover:border-brand-500/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all">
                      <Paperclip size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[180px]">{file.filename}</p>
                      <p className="text-[10px] opacity-40">{formatFileSize(file.size)} · {file.uploadedBy}</p>
                    </div>
                  </div>
                  <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Response Section */}
          {ir.response && (
            <div className="card p-6 border-emerald-500/20 bg-emerald-500/5">
              <h3 className="section-title mb-6 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Response Information
              </h3>
              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{ir.response.content}</p>
              </div>
              <p className="text-[10px] font-mono opacity-40">Submitted at {formatDateTime(ir.response.submittedAt)}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4">Key Info</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="opacity-30" />
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-30">Due Date</p>
                  <p className={`text-sm font-bold ${overdue ? "text-rose-500" : "text-white"}`}>
                    {formatDate(ir.dueDate)}
                    <span className="ml-2 text-[10px] font-medium opacity-50">
                      ({overdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`})
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User2 size={18} className="opacity-30" />
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-30">Assigned To</p>
                  <p className="text-sm font-bold">{ir.assignedUser?.name || "Unassigned"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={18} className="opacity-30" />
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-30">Responder</p>
                  <p className="text-sm font-bold">{ir.responderCompany.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow / History */}
          <div className="card p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-6">Workflow History</h3>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {ir.workflowLogs.map((log: any, idx: number) => (
                <div key={log.id} className="flex gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-black z-10 ${idx === 0 ? "bg-brand-500" : "bg-gray-700"}`}>
                    {STEP_ICONS[log.step] || <Activity size={12} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{log.action}</p>
                    <p className="text-[10px] opacity-40 mb-1">{log.actorName} · {formatDateTime(log.timestamp)}</p>
                    {log.comment && (
                      <p className="text-[11px] p-2 rounded bg-black/20 opacity-70 border border-white/5">{log.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delegate Modal */}
      {showDelegateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">
                {delegateType === "delegation" ? "Delegate Task" : "Request Technical Input"}
              </h3>
              <button onClick={() => setShowDelegateModal(false)} className="btn-icon">
                <XCircle size={20} />
              </button>
            </div>
            
            <p className="text-xs opacity-60 mb-6 leading-relaxed">
              {delegateType === "delegation" 
                ? "Transfer the authority of this task to a colleague. They will be able to perform actions on your behalf."
                : "Request a specific input from a colleague. They will be notified to provide technical comments."}
            </p>

            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
              <input 
                type="text" 
                className="input pl-10" 
                placeholder="Search colleagues..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-6 pr-2">
              {availableUsers.map(u => (
                <div 
                  key={u.id}
                  onClick={() => updateIRStatus(ir.status, `Delegated to ${u.name}`, u.id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-black/5 hover:bg-brand-500/10 border border-transparent hover:border-brand-500/30 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold">
                    {u.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-brand-500 transition-colors">{u.name}</p>
                    <p className="text-[10px] opacity-40">{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowDelegateModal(false)} className="btn-secondary w-full">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Activity({ size }: { size: number }) {
  return <Clock size={size} />;
}
