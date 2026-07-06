import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Notification, ChatMessage, AIChat } from "../types";
import { api } from "../services/api";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface AppContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  login: (email: string, passwordHash: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  
  // Persistent Chat State
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatLoading: boolean;
  setChatLoading: (loading: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isChatMaximized: boolean;
  setIsChatMaximized: (maximized: boolean) => void;
  chatSessions: { id: string; title: string; messages: ChatMessage[] }[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  startNewChat: () => void;
  clearChatHistory: () => Promise<void>;
  deleteSession: (id: string) => void;
  sendChatMessage: (msg: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("hostel_token"));
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persistent Chat State variables and methods
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isChatMaximized, setIsChatMaximized] = useState<boolean>(false);
  const [chatSessions, setChatSessions] = useState<{ id: string; title: string; messages: ChatMessage[] }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  const initDefaultSession = async (currUser: User) => {
    try {
      const pChat = await api.chat.getHistory();
      const serverMessages = pChat.messages || [];
      const defaultSess = {
        id: "session-default",
        title: "Main Assistant Chat",
        messages: serverMessages.length > 0 ? serverMessages : [
          {
            role: "model" as const,
            content: "Hello! I am your AI Hostel Assistant. 🎓⭐\n\nI can help you:\n- 📝 Write and submit Leave Letters\n- 🛠️ File Maintenance complaints\n- 🚪 Book Visitor Passes\n- ⏰ Check Curfew rules and fee timings\n\nHow can I help you today?",
            timestamp: new Date().toISOString()
          }
        ]
      };
      setChatSessions([defaultSess]);
      setActiveSessionId("session-default");
      setChatMessages(defaultSess.messages);
    } catch (e) {
      const defaultSess = {
        id: "session-default",
        title: "Main Assistant Chat",
        messages: [
          {
            role: "model" as const,
            content: "Hello! I am your AI Hostel Assistant. 🎓⭐\n\nHow can I help you today?",
            timestamp: new Date().toISOString()
          }
        ]
      };
      setChatSessions([defaultSess]);
      setActiveSessionId("session-default");
      setChatMessages(defaultSess.messages);
    }
  };

  // Load chat sessions from localStorage when user is available
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`hostel_chats_${user.id}`);
      if (saved) {
        try {
          const sessions = JSON.parse(saved);
          setChatSessions(sessions);
          if (sessions.length > 0) {
            setActiveSessionId(sessions[0].id);
            setChatMessages(sessions[0].messages);
          } else {
            initDefaultSession(user);
          }
        } catch (e) {
          console.error("Failed to parse chat sessions", e);
          initDefaultSession(user);
        }
      } else {
        initDefaultSession(user);
      }
    } else {
      setChatSessions([]);
      setChatMessages([]);
      setActiveSessionId("");
    }
  }, [user]);

  // Sync active session's messages to the overall state
  useEffect(() => {
    if (activeSessionId) {
      const active = chatSessions.find(s => s.id === activeSessionId);
      if (active) {
        setChatMessages(active.messages);
      }
    }
  }, [activeSessionId, chatSessions]);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (user && chatSessions.length > 0) {
      localStorage.setItem(`hostel_chats_${user.id}`, JSON.stringify(chatSessions));
    }
  }, [chatSessions, user]);

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const pChat = await api.chat.getHistory();
      if (pChat && pChat.messages) {
        setChatSessions(prev => {
          const updated = prev.map(s => s.id === "session-default" ? { ...s, messages: pChat.messages } : s);
          // If default session didn't exist, we add it
          if (!updated.some(s => s.id === "session-default")) {
            updated.unshift({
              id: "session-default",
              title: "Main Assistant Chat",
              messages: pChat.messages
            });
          }
          return updated;
        });
      }
    } catch (e) {
      console.error("Failed to fetch chat history from server", e);
    }
  };

  const startNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSess = {
      id: newId,
      title: "New Chat Session",
      messages: [
        {
          role: "model" as const,
          content: "Hello! Let's start a fresh discussion. How can HERA assist you in this new session?",
          timestamp: new Date().toISOString()
        }
      ]
    };
    setChatSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newId);
    setChatMessages(newSess.messages);
    showToast("New chat session started", "success");
  };

  const clearChatHistory = async () => {
    if (!user) return;
    try {
      setChatLoading(true);
      await api.chat.clearHistory();
      
      // Also clear active session on client
      setChatSessions(prev => {
        return prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [
                {
                  role: "model" as const,
                  content: "I have cleared our conversation history. How can I help you with a fresh start?",
                  timestamp: new Date().toISOString()
                }
              ]
            };
          }
          return s;
        });
      });
      showToast("Conversation cleared", "info");
    } catch (e) {
      showToast("Failed to clear conversation on server", "error");
    } finally {
      setChatLoading(false);
    }
  };

  const deleteSession = (id: string) => {
    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const fallback = {
          id: "session-default",
          title: "Main Assistant Chat",
          messages: [
            {
              role: "model" as const,
              content: "Hello! How can HERA assist you today?",
              timestamp: new Date().toISOString()
            }
          ]
        };
        setActiveSessionId("session-default");
        return [fallback];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
    showToast("Session removed", "info");
  };

  const sendChatMessage = async (msg: string) => {
    if (!msg.trim() || !user) return;
    setChatLoading(true);

    const userMsg = {
      role: "user" as const,
      content: msg,
      timestamp: new Date().toISOString()
    };

    // Update active session locally
    setChatSessions(prev => {
      return prev.map(s => {
        if (s.id === activeSessionId) {
          let title = s.title;
          if (s.messages.length <= 1 || s.title === "New Chat Session") {
            title = msg.length > 28 ? msg.slice(0, 25) + "..." : msg;
          }
          return {
            ...s,
            title,
            messages: [...s.messages, userMsg]
          };
        }
        return s;
      });
    });

    try {
      const res = await api.chat.sendMessage(msg);
      const serverMessages = res.chat.messages;

      // Update with server output
      setChatSessions(prev => {
        return prev.map(s => {
          if (s.id === activeSessionId) {
            const modelReply = serverMessages[serverMessages.length - 1];
            return {
              ...s,
              messages: [...s.messages, {
                role: "model" as const,
                content: modelReply.content,
                timestamp: modelReply.timestamp || new Date().toISOString()
              }]
            };
          }
          return s;
        });
      });

      if (res.aiFeedback?.actionTakenMessage) {
        showToast(res.aiFeedback.actionTakenMessage, "success");
      }
    } catch (e: any) {
      showToast("Failed to chat with AI", "error");
    } finally {
      setChatLoading(false);
    }
  };

  // Show customized gold-theme toast alerts
  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Login handler
  const login = async (email: string, passwordHash: string, rememberMe?: boolean) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, passwordHash, rememberMe });
      localStorage.setItem("hostel_token", res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, "success");
    } catch (e: any) {
      showToast(e.message || "Failed to sign in", "error");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.auth.register(data);
      localStorage.setItem("hostel_token", res.token);
      setToken(res.token);
      setUser(res.user);
      showToast("Account registered successfully!", "success");
      return res;
    } catch (e: any) {
      showToast(e.message || "Failed to register", "error");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("hostel_token");
    localStorage.removeItem("activePanel");
    setToken(null);
    setUser(null);
    setNotifications([]);
    showToast("Signed out successfully.", "info");
  };

  // Fetch current user details
  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.auth.getMe();
      setUser(res.user);
    } catch (e) {
      console.error("Auth me check failed", e);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Notifications handler
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  const markNotifRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const timer = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [user, token]);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        loading,
        toasts,
        showToast,
        removeToast,
        login,
        register,
        logout,
        refreshUser,
        notifications,
        fetchNotifications,
        markNotifRead,
        chatMessages,
        setChatMessages,
        chatLoading,
        setChatLoading,
        isChatOpen,
        setIsChatOpen,
        isChatMaximized,
        setIsChatMaximized,
        chatSessions,
        activeSessionId,
        setActiveSessionId,
        startNewChat,
        clearChatHistory,
        deleteSession,
        sendChatMessage,
        loadChatHistory,
      }}
    >
      {children}

      {/* Floating Gold Theme Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-sm flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 fade-in-slide ${
              t.type === "success"
                ? "bg-stone-900/90 border-[#D4AF37]/50 text-white"
                : t.type === "error"
                ? "bg-red-950/90 border-red-500/50 text-white"
                : t.type === "warning"
                ? "bg-yellow-950/90 border-yellow-500/50 text-white"
                : "bg-stone-900/90 border-zinc-700/50 text-white"
            }`}
          >
            {t.type === "success" && (
              <span className="text-[#D4AF37] font-bold text-lg leading-none">✓</span>
            )}
            {t.type === "error" && (
              <span className="text-red-500 font-bold text-lg leading-none">✕</span>
            )}
            {t.type === "warning" && (
              <span className="text-yellow-500 font-bold text-lg leading-none">⚠</span>
            )}
            {t.type === "info" && (
              <span className="text-[#F5C542] font-bold text-lg leading-none">ℹ</span>
            )}
            <div className="flex-1">
              <p className="font-semibold text-xs uppercase tracking-wider text-zinc-400 mb-0.5">
                {t.type}
              </p>
              <p className="text-zinc-100 leading-relaxed font-sans">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-500 hover:text-white transition-colors text-xs self-start"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
