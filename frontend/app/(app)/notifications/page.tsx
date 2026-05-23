"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Bell, CheckCheck, ArrowRight, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Clock, FileText, Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import { Notification } from "@/types";

const NOTIF_ICONS: Record<Notification["type"], React.ReactNode> = {
  ir_submitted: <FileText size={14} className="text-blue-400" />,
  ir_approved: <CheckCircle2 size={14} className="text-emerald-400" />,
  ir_rejected: <XCircle size={14} className="text-red-400" />,
  response_submitted: <FileText size={14} className="text-purple-400" />,
  response_approved: <CheckCircle2 size={14} className="text-emerald-400" />,
  response_rejected: <XCircle size={14} className="text-red-400" />,
  closeout: <CheckCircle2 size={14} className="text-emerald-400" />,
  sla_warning: <Clock size={14} className="text-amber-400" />,
  sla_overdue: <AlertTriangle size={14} className="text-red-400" />,
  recycle_approved: <RotateCcw size={14} className="text-rose-400" />,
  message: <MessageSquare size={14} className="text-blue-400" />,
  workflow_update: <ShieldAlert size={14} className="text-cyan-400" />,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadNotifications() {
      try {
        setIsLoading(true);
        const data = await api.get<Notification[]>('/notifications');
        setNotifs(data);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      setNotifs((prev) => {
        const updated = [notification, ...prev];
        const unread = updated.filter((n) => !n.isRead).length;
        window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { unread } }));
        return updated;
      });
    };

    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all', {});
      const updated = notifs.map((n) => ({ ...n, isRead: true }));
      setNotifs(updated);
      // notify layout about updated count
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { unread: 0 } }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      const updated = notifs.map((n) => n.id === id ? { ...n, isRead: true } : n);
      setNotifs(updated);
      const unread = updated.filter((n) => !n.isRead).length;
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { unread } }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button id="mark-all-read-btn" onClick={markAllRead} className="btn-secondary btn-sm">
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center opacity-70">
          <Loader2 size={34} className="animate-spin mb-3" />
          <p className="text-sm">Loading notifications...</p>
        </div>
      ) : notifs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Bell size={48} className="text-[#4a5568] mb-4 opacity-60" />
          <h3 className="text-lg font-semibold text-white">No Notifications</h3>
          <p className="text-[#8892b0] text-sm mt-1">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id}
              className={`card flex items-start gap-4 transition-all duration-200 hover:border-brand-500/30 ${!n.isRead ? "border-brand-500/25 bg-brand-500/5" : ""}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.isRead ? "bg-brand-600/25" : "bg-[#1c2240]"}`}>
                {NOTIF_ICONS[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 float-right mt-1 flex-shrink-0 animate-pulse" />}
                <p className={`text-sm ${!n.isRead ? "text-white font-medium" : "text-[#c0c8e8]"}`}>{n.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-[#4a5568]">{formatDateTime(n.createdAt)}</span>
                  <Link href={n.link || `/ir/${n.irId || ''}`} onClick={() => markRead(n.id)}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    {n.link ? 'Open' : `View ${n.irNumber || ''}`} <ArrowRight size={10} />
                  </Link>
                  {!n.isRead && (
                    <button onClick={() => markRead(n.id)} className="text-xs text-[#4a5568] hover:text-[#8892b0]">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
