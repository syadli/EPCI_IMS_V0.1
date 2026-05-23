"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Message, User } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Search, Send, MessageSquare, Check, CheckCheck, Loader2 } from "lucide-react";

export default function MessagesPage() {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<User[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations (users list)
  useEffect(() => {
    async function fetchConversations() {
      try {
        setIsLoading(true);
        // In a real app, this would be an endpoint returning users we have chatted with
        // For now, let's just get all users to allow starting new chats
        const users = await api.get<User[]>("/users");
        setConversations(users.filter(u => u.id !== currentUser?.id));
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchConversations();
  }, [currentUser]);

  // 2. Fetch messages for selected user
  useEffect(() => {
    if (!selectedUserId) return;

    async function fetchMessages() {
      try {
        setIsMessagesLoading(true);
        const data = await api.get<Message[]>(`/messages/${selectedUserId}`);
        setActiveMessages(data);
        
        // Mark as read
        await api.post(`/messages/${selectedUserId}/read`, {});
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsMessagesLoading(false);
      }
    }

    fetchMessages();

    return () => {
      // cleanup handled by socket listener
    };
  }, [selectedUserId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (!selectedUserId) return;
      if (message.senderId === selectedUserId || message.receiverId === selectedUserId) {
        setActiveMessages((prev) => [...prev, message]);
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [selectedUserId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedUserId || !currentUser) return;
    
    try {
      const newMsg = await api.post<Message>("/messages", {
        receiverId: selectedUserId,
        content: inputText.trim(),
      });
      
      setActiveMessages(prev => [...prev, newMsg]);
      setInputText("");
    } catch (error) {
      alert("Failed to send message");
    }
  };

  const filteredUsers = conversations.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.company?.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = conversations.find((u) => u.id === selectedUserId);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in">
      {/* Left Pane - Contact List */}
      <div className="w-1/3 min-w-[300px] flex flex-col card p-0 overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-10 text-center opacity-50">
              <Loader2 className="animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading contacts...</p>
            </div>
          ) : filteredUsers.map((u) => {
            const isSelected = selectedUserId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full flex items-start gap-3 p-4 border-b text-left transition-colors ${isSelected ? "bg-brand-500/10" : "hover:bg-brand-500/5"}`}
                style={{ borderColor: "var(--border)" }}
              >
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {u.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-sm truncate">{u.name}</span>
                  </div>
                  <div className="text-xs truncate opacity-60">{u.company?.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane - Chat Window */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden relative">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-black/5" style={{ borderColor: "var(--border)" }}>
              <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                {selectedUser?.avatarInitials}
              </div>
              <div>
                <h3 className="font-bold">{selectedUser?.name}</h3>
                <p className="text-xs opacity-60 uppercase font-bold tracking-widest">{selectedUser?.role} • {selectedUser?.company?.name}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/10">
              {isMessagesLoading && activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <Loader2 size={32} className="animate-spin" />
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <MessageSquare size={48} className="mb-4" />
                  <p>No messages yet.</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div 
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? "bg-brand-600 text-white rounded-br-sm" : "bg-white/5 text-white rounded-bl-sm border border-white/10"}`}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 opacity-40">
                        <span className="text-[10px]">
                          {formatDateTime(msg.timestamp).split(',')[1]?.trim() || "Just now"}
                        </span>
                        {isMe && (
                          msg.isRead ? <CheckCheck size={12} className="text-brand-400" /> : <Check size={12} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-black/5" style={{ borderColor: "var(--border)" }}>
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-end gap-2"
              >
                <textarea
                  className="input flex-1 resize-none max-h-32 min-h-[44px]"
                  placeholder="Type a message..."
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="btn-primary flex-shrink-0 h-[44px] w-[44px] !p-0 flex items-center justify-center rounded-full"
                >
                  <Send size={18} className="mr-0.5 mt-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <MessageSquare size={80} className="mb-6" />
            <h2 className="text-2xl font-bold mb-2">Direct Messaging</h2>
            <p className="max-w-xs">Select a contact from the list to view or start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
