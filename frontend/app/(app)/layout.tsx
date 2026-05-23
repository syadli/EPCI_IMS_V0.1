"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useProject } from "@/lib/projectContext";
import { useTheme } from "@/lib/themeContext";
import { api } from "@/lib/api";
import { getSocket, initSocket } from "@/lib/socket";
import { ROLE_LABELS } from "@/lib/utils";
import { Notification } from "@/types";
import {
  LayoutDashboard, FileText, PlusCircle, CheckSquare,
  Bell, Users, LogOut, ChevronDown, ChevronRight,
  Layers, Menu, Shield, Activity, UserCog,
  Sun, Moon, PanelLeftClose, PanelLeftOpen, MessageSquare,
  Globe
} from "lucide-react";

  const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",      icon: LayoutDashboard, roles: ["admin","manager","user","client"] },
  { href: "/ir-register",  label: "IR Register",    icon: FileText,        roles: ["admin","manager","user","client"] },
  { href: "/ir/create",    label: "New IR",          icon: PlusCircle,      roles: ["admin","manager","user"] },
  { href: "/my-tasks",     label: "My Tasks",        icon: CheckSquare,     roles: ["admin","manager","user","client"] },
  { href: "/messages",     label: "Messages",        icon: MessageSquare,   roles: ["admin","manager","user","client"] },
];

const ADMIN_NAV = [
  { href: "/admin/projects", label: "Project Management", icon: Globe,   roles: ["super_user", "admin"] },
  { href: "/admin/users",    label: "User Management",    icon: Users,   roles: ["super_user", "admin", "project_admin"] },
  { href: "/admin/sla",      label: "SLA Config",         icon: Shield,  roles: ["super_user", "admin"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeProject, availableProjects, setActiveProjectById } = useProject();
  const router = useRouter();
  const pathname = usePathname();

  // true = expanded (w-56), false = collapsed (w-16)
  const [expanded, setExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [taskAlerts, setTaskAlerts] = useState(0);

  useEffect(() => { if (!user) router.replace("/login"); }, [user, router]);

  useEffect(() => {
    if (!user) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('epci_token') : null;
    if (!token) return;

    const socket = initSocket(token);

    async function loadNotifications() {
      try {
        const notifications = await api.get<Notification[]>('/notifications');
        setUnreadNotifications(notifications.filter((n) => !n.isRead).length);
      } catch (error) {
        console.error('Failed to load notifications count:', error);
      }
    }

    async function loadMessageCount() {
      try {
        const cnt = await api.get<number>('/messages/unread-count');
        setUnreadMessages(cnt);
      } catch (error) {
        console.error('Failed to load unread messages count:', error);
      }
    }

    async function loadTaskCount() {
      try {
        const irs = await api.get<any[]>('/interface-requests');
        // compute tasks similarly to MyTasksPage
        const myId = user!.id;
        const projectId = undefined;
        const activeProjectId = undefined;
        const tasks = irs.filter((ir) => {
          // basic approximation: assigned to me OR status relevant to role
          if (ir.assignedUserId === myId) return true;
          switch (user!.role) {
            case 'client':
              return ['awaiting_request_validation','awaiting_response_validation','awaiting_closeout','ir_recycle'].includes(ir.status);
            case 'manager':
              return (
                (ir.status === 'awaiting_request_validation' && ir.requestorCompanyId === user!.companyId) ||
                (ir.status === 'awaiting_response' && ir.responderCompanyId === user!.companyId) ||
                (ir.status === 'awaiting_response_acceptance' && ir.requestorCompanyId === user!.companyId)
              );
            case 'user':
              return (
                (ir.status === 'draft' && ir.requestorUserId === myId) ||
                (ir.status === 'awaiting_response' && ir.responderCompanyId === user!.companyId)
              );
            case 'admin':
              return ir.status !== 'closed';
            default:
              return false;
          }
        });
        setTaskAlerts(tasks.length);
      } catch (error) {
        console.error('Failed to load tasks count:', error);
      }
    }
    loadNotifications();
    loadMessageCount();
    loadTaskCount();

    const handleNotification = () => setUnreadNotifications((count) => count + 1);
    const handleMessage = (message: any) => {
      // increment unread if receiver is current user
      if (message.receiverId === user.id) setUnreadMessages((c) => c + 1);
    };
    const handleWorkflow = (payload: any) => {
      // workflow updates relevant to user will be emitted by backend
      setTaskAlerts((c) => c + 1);
    };

    socket?.on('notification:new', handleNotification);
    socket?.on('message:new', handleMessage);
    socket?.on('workflow:update', handleWorkflow);

    // listen to notifications updates from NotificationsPage
    const notifListener = (e: any) => {
      setUnreadNotifications(e.detail?.unread ?? 0);
    };
    window.addEventListener('notifications:updated', notifListener as EventListener);

    return () => {
      socket?.off('notification:new', handleNotification);
      socket?.off('message:new', handleMessage);
      socket?.off('workflow:update', handleWorkflow);
      window.removeEventListener('notifications:updated', notifListener as EventListener);
    };
  }, [user]);

  // Clear counters when navigating to the respective pages
  useEffect(() => {
    if (!user) return;
    if (pathname?.startsWith('/messages')) {
      // mark all messages read on server and clear count
      api.post('/messages/mark-all-read', {}).then(() => setUnreadMessages(0)).catch(() => {});
    }
    if (pathname?.startsWith('/my-tasks')) {
      // clear task alerts locally (they will repopulate via websocket if new)
      setTaskAlerts(0);
    }
  }, [pathname, user]);

  if (!user) return null;

  const toggleSidebar = () => setExpanded(!expanded);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Sidebar */}
      <aside 
        className={`flex-shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out`}
        style={{ 
          width: expanded ? "14rem" : "4.5rem",
          background: "var(--bg-sidebar)",
          borderColor: "var(--border-sidebar)"
        }}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-4 gap-3 border-b" style={{ borderColor: "var(--border-sidebar)" }}>
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Layers size={18} className="text-white" />
          </div>
          {expanded && (
            <span className="font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden" style={{ color: "var(--text-heading)" }}>
              EPCI IMS
            </span>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                  active 
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                    : "hover:bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={20} className={active ? "text-white" : "group-hover:text-brand-400"} />
                {expanded && <span className="text-sm font-medium">{item.label}</span>}
                {/* Badges for Messages, Notifications, My Tasks */}
                {item.href === '/notifications' && unreadNotifications > 0 && (
                  <span className="ml-auto text-xs font-semibold text-white bg-rose-500 rounded-full px-2 py-0.5">{unreadNotifications}</span>
                )}
                {item.href === '/messages' && unreadMessages > 0 && (
                  <span className="ml-auto text-xs font-semibold text-white bg-blue-500 rounded-full px-2 py-0.5">{unreadMessages}</span>
                )}
                {item.href === '/my-tasks' && taskAlerts > 0 && (
                  <span className="ml-auto text-xs font-semibold text-white bg-amber-500 rounded-full px-2 py-0.5">{taskAlerts}</span>
                )}
                {!expanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Admin Section */}
          {(user.role === "super_user" || user.role === "admin" || user.role === "project_admin") && (
            <div className="pt-4">
              {expanded && <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest opacity-30">Admin</div>}
              <div className="h-px bg-white/5 mb-2 sm:hidden" />
              {ADMIN_NAV.filter(item => item.roles.includes(user.role)).map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                      active 
                        ? "bg-brand-600 text-white" 
                        : "hover:bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-white" : "group-hover:text-brand-400"} />
                    {expanded && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* User card */}
        <div className="border-t flex-shrink-0 p-2" style={{ borderColor: "var(--border-sidebar)" }}>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
              className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors"
              style={{ background: userMenuOpen ? "rgba(255,255,255,0.05)" : "transparent" }}
            >
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {user.avatarInitials}
              </div>
              {expanded && (
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--text-heading)" }}>{user.name}</div>
                  <div className="text-[10px] opacity-50 truncate">{ROLE_LABELS[user.role]}</div>
                </div>
              )}
              {expanded && <ChevronDown size={14} className={`opacity-50 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />}
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className={`absolute bottom-full left-0 mb-2 w-52 card-glass z-50 p-1 shadow-xl animate-scale-in origin-bottom-left`}>
                  <div className="px-3 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                    <div className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{user.company.name}</div>
                    <div className="text-[10px] opacity-50">{user.email}</div>
                  </div>
                  
                  <button onClick={() => switchRole("admin")} className="menu-item">
                    <Shield size={14} /> Switch to Admin
                  </button>
                  <button onClick={() => switchRole("client")} className="menu-item">
                    <UserCog size={14} /> Switch to Client
                  </button>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                  <button onClick={logout} className="menu-item text-rose-500 hover:bg-rose-500/10">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b z-30" 
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-black/5 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              {expanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Projects</span>
              <ChevronRight size={12} />
              <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{activeProject?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Project Switcher */}
            {availableProjects.length > 0 && (
              <div className="relative">
                <button 
                  id="project-switcher"
                  onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-black/5 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Globe size={16} className="text-brand-500" />
                  <div className="text-left hidden sm:block">
                    <div className="text-[10px] uppercase tracking-wider font-bold opacity-50">Project</div>
                    <div className="text-xs font-semibold truncate max-w-[150px]" style={{ color: "var(--text-heading)" }}>
                      {activeProject?.name || "Select Project"}
                    </div>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${projectMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {projectMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProjectMenuOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-64 card-glass z-50 p-1 shadow-xl animate-scale-in origin-top-right">
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest opacity-50">Switch Project</div>
                      {availableProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProjectById(p.id);
                            setProjectMenuOpen(false);
                          }}
                          className={`w-full flex flex-col items-start gap-0.5 px-3 py-2 rounded-md transition-colors text-left ${activeProject?.id === p.id ? "bg-brand-500/10 text-brand-500" : "hover:bg-black/5"}`}
                        >
                          <div className="text-xs font-semibold">{p.name}</div>
                          <div className="text-[10px] opacity-60 font-mono">{p.code}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-2 hidden sm:block" />
            
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Messages */}
            <Link href="/messages" className="btn-icon relative">
              <MessageSquare size={18} />
            </Link>

            {/* Notifications bell */}
            <Link href="/notifications" className="btn-icon relative">
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2" style={{ borderColor: "var(--bg-card)" }} />
              )}
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
