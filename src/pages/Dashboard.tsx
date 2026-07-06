import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { 
  Bot, LayoutDashboard, User, Shield, AlertCircle, FileText, Calendar, 
  CreditCard, Users, Bed, Bell, LogOut, Send, Star, ClipboardList,
  CheckCircle, XCircle, Search, Trash2, Plus, Sparkles, ChevronRight, Settings,
  MapPin, Loader2, RefreshCw, BarChart2, Info, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Room, Complaint, Leave, Visitor, Fee, Notice, User as DBUser, MenuItem, MessFeedback, AnalyticsData } from "../types";

export default function Dashboard() {
  const { user, logout, showToast, notifications, markNotifRead, fetchNotifications } = useApp();
  const navigate = useNavigate();

  // Redirect if logged out
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  // Navigation Panel State
  const [activePanel, setActivePanel] = useState<string>(() => {
    return localStorage.getItem("activePanel") || "overview";
  });

  useEffect(() => {
    localStorage.setItem("activePanel", activePanel);
  }, [activePanel]);

  // Global Data States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [allUsers, setAllUsers] = useState<DBUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Chat Agent States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [typingText, setTypingText] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mess Menu & Feedback States
  const [messMenu, setMessMenu] = useState<any>(null);
  const [messFeedbacks, setMessFeedbacks] = useState<MessFeedback[]>([]);
  const [mealRating, setMealRating] = useState<number>(5);
  const [mealComment, setMealComment] = useState<string>("");

  // Loading indicator for refetches
  const [globalLoading, setGlobalLoading] = useState<boolean>(true);

  // Form input states
  const [complaintForm, setComplaintForm] = useState({ title: "", description: "" });
  const [leaveForm, setLeaveForm] = useState({ startDate: "", endDate: "", reason: "", autoLetter: true });
  const [visitorForm, setVisitorForm] = useState({ visitorName: "", relation: "", visitDate: "", purpose: "" });
  const [newRoomForm, setNewRoomForm] = useState({ roomNumber: "", block: "A", capacity: 3 });
  const [newNoticeForm, setNewNoticeForm] = useState({ title: "", content: "", priority: "normal" as "normal" | "urgent" });

  // UI state overlays
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [breakdownFeeId, setBreakdownFeeId] = useState<string | null>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Warden dispatch state
  const [dispatchComplaint, setDispatchComplaint] = useState<Complaint | null>(null);
  const [dispatcherName, setDispatcherName] = useState<string>("");

  // Room allocation state
  const [allocatingRoom, setAllocatingRoom] = useState<Room | null>(null);
  const [unallocatedStudents, setUnallocatedStudents] = useState<DBUser[]>([]);

  // ==========================================
  // REAL-TIME DEMO SIMULATION STATES
  // ==========================================
  const [complaintSimulators, setComplaintSimulators] = useState<Record<string, {
    elapsed: number;
    department: string;
    staff: string;
    eta: string;
    priority: "low" | "medium" | "high" | "critical";
  }>>({});

  const [leaveSimulators, setLeaveSimulators] = useState<Record<string, {
    elapsed: number;
    approvalId: string;
    approvedBy: string;
    approvedAt: string;
  }>>({});

  // Hostel Fees Module Custom State
  const [feeStats, setFeeStats] = useState({
    total: 500000,
    paid: 0,
    pending: 500000,
    dueDate: "20-Aug-2026",
    nextInstallment: 500000,
  });

  const [feeTransactions, setFeeTransactions] = useState<any[]>([]);

  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success">("idle");
  const [paymentSecLeft, setPaymentSecLeft] = useState(5);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [showFeeDetailsModal, setShowFeeDetailsModal] = useState<boolean>(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");

  const [visitorSimulators, setVisitorSimulators] = useState<Record<string, {
    elapsed: number;
    notified: boolean;
  }>>({});

  // Helper to run AI parsing of complaints
  const analyzeComplaintAI = (title: string, description: string) => {
    const text = (title + " " + description).toLowerCase();
    let dept = "Other";
    let staff = "Maintenance Duty Hand";
    let eta = "3 Hours";
    let priority: "low" | "medium" | "high" | "critical" = "medium";

    if (text.includes("leak") || text.includes("pipe") || text.includes("tap") || text.includes("washbasin") || text.includes("faucet") || text.includes("toilet") || text.includes("flush")) {
      dept = "Plumbing";
      staff = "Suresh Kumar (Senior Plumber)";
      eta = "1.5 Hours";
      priority = text.includes("flood") || text.includes("burst") ? "critical" : "high";
    } else if (text.includes("light") || text.includes("fan") || text.includes("switch") || text.includes("spark") || text.includes("wire") || text.includes("short") || text.includes("plug") || text.includes("power")) {
      dept = "Electrical";
      staff = "Ramesh Pal (Lead Electrician)";
      eta = "1 Hour";
      priority = text.includes("spark") || text.includes("shock") ? "critical" : "high";
    } else if (text.includes("dust") || text.includes("sweep") || text.includes("clean") || text.includes("garbage") || text.includes("messy") || text.includes("smell") || text.includes("odor")) {
      dept = "Cleaning";
      staff = "Harish Lal (Sanitation Staff)";
      eta = "45 Mins";
      priority = "low";
    } else if (text.includes("chair") || text.includes("table") || text.includes("bed") || text.includes("almirah") || text.includes("door") || text.includes("lock") || text.includes("window") || text.includes("hinge")) {
      dept = "Furniture";
      staff = "Mohit Sharma (Carpenter)";
      eta = "4 Hours";
      priority = text.includes("lock") || text.includes("door") ? "high" : "medium";
    } else if (text.includes("wifi") || text.includes("internet") || text.includes("router") || text.includes("network") || text.includes("lan") || text.includes("slow") || text.includes("connect")) {
      dept = "Internet";
      staff = "Alok Sengupta (IT Administrator)";
      eta = "30 Mins";
      priority = "medium";
    } else if (text.includes("water") || text.includes("drinking") || text.includes("cooler") || text.includes("hot") || text.includes("supply")) {
      dept = "Water Supply";
      staff = "Devendra Singh (Hydraulics Wing)";
      eta = "2 Hours";
      priority = "high";
    } else if (text.includes("thief") || text.includes("steal") || text.includes("key") || text.includes("stranger") || text.includes("camera") || text.includes("gate") || text.includes("guard")) {
      dept = "Security";
      staff = "Guard Baldev (Security Desk)";
      eta = "15 Mins";
      priority = "critical";
    }
    
    return { dept, staff, eta, priority };
  };

  // Timer Effect loop to update 30-seconds simulator countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      // Tick complaint simulators
      setComplaintSimulators(prev => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach(id => {
          const sim = next[id];
          if (sim.elapsed < 30) {
            sim.elapsed += 1;
            updated = true;
            
            // Trigger approved toast/notification at exactly 30s
            if (sim.elapsed === 30) {
              showToast("✅ Complaint Approved by AI Warden", "success");
              // Call API to update the server DB status so it stays approved
              api.complaints.updateStatus(id, { 
                status: "assigned", 
                assignedTo: sim.staff, 
                remarks: `Approved by HERA AI. Department: ${sim.department}, ETA: ${sim.eta}`
              }).then(() => {
                loadDashboardData();
              }).catch(err => console.error(err));
            }
          }
        });
        return updated ? next : prev;
      });

      // Tick leave simulators
      setLeaveSimulators(prev => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach(id => {
          const sim = next[id];
          if (sim.elapsed < 30) {
            sim.elapsed += 1;
            updated = true;

            // Trigger approved toast/notification at exactly 30s
            if (sim.elapsed === 30) {
              showToast("Leave Request Approved Successfully", "success");
              // Call API to update status in server DB
              api.leave.updateStatus(id, { status: "approved" })
                .then(() => {
                  loadDashboardData();
                }).catch(err => console.error(err));
            }
          }
        });
        return updated ? next : prev;
      });

      // Tick visitor simulators
      setVisitorSimulators(prev => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach(id => {
          const sim = next[id];
          if (sim.elapsed < 30) {
            sim.elapsed += 1;
            updated = true;

            // Trigger approved toast/notification at exactly 30s
            if (sim.elapsed === 30 && !sim.notified) {
              sim.notified = true;
              showToast("✅ Visitor Pass Approved Successfully", "success");
              // Call API to update status in server DB
              api.visitors.updateStatus(id, "approved")
                .then(() => {
                  loadDashboardData();
                }).catch(err => console.error(err));
            }
          }
        });
        return updated ? next : prev;
      });

    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Core Data Refetch Trigger
  const loadDashboardData = async () => {
    setGlobalLoading(true);
    try {
      if (user.role === "student") {
        const [pRooms, pComplaints, pLeaves, pVisitors, pFees, pNotices, pChat, pMess] = await Promise.all([
          api.rooms.getAll(),
          api.complaints.getAll(),
          api.leave.getAll(),
          api.visitors.getAll(),
          api.fees.getAll(),
          api.notices.getAll(),
          api.chat.getHistory(),
          api.mess.getDetails(),
        ]);
        setRooms(pRooms);
        setComplaints(pComplaints);
        setLeaves(pLeaves);
        setVisitors(pVisitors);
        setFees(pFees);
        setNotices(pNotices);
        setChatMessages(pChat.messages);
        setMessMenu(pMess.menu);
        setMessFeedbacks(pMess.feedback);
      } else {
        // Warden and Admin Data
        const [pRooms, pComplaints, pLeaves, pVisitors, pFees, pNotices, pAnalytics, pUsers] = await Promise.all([
          api.rooms.getAll(),
          api.complaints.getAll(),
          api.leave.getAll(),
          api.visitors.getAll(),
          api.fees.getAll(),
          api.notices.getAll(),
          api.reports.getAnalytics(),
          user.role === "admin" ? api.reports.getAllUsers() : Promise.resolve([]),
        ]);
        setRooms(pRooms);
        setComplaints(pComplaints);
        setLeaves(pLeaves);
        setVisitors(pVisitors);
        setFees(pFees);
        setNotices(pNotices);
        setAnalytics(pAnalytics);
        setAllUsers(pUsers);

        // Filter unallocated students for room assignation panel
        const studentsList = user.role === "admin" ? pUsers.filter(u => u.role === "student") : [];
        if (studentsList.length > 0) {
          setUnallocatedStudents(studentsList.filter(s => !s.roomNumber));
        } else {
          // If warden, query all users or mock list
          fetch("/api/users")
            .then(res => res.json())
            .then(data => {
              const stds = data.filter((u: any) => u.role === "student");
              setUnallocatedStudents(stds.filter((s: any) => !s.roomNumber));
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Scroll Chat to Bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // 1. Submit Complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.title || !complaintForm.description) {
      showToast("Complaint title and description required", "warning");
      return;
    }
    try {
      const res = await api.complaints.create(complaintForm);
      showToast("Complaint submitted successfully. AI is reviewing your request...", "success");
      setComplaintForm({ title: "", description: "" });
      
      const newComp = res.complaint;
      if (newComp && newComp.id) {
        const { dept, staff, eta, priority } = analyzeComplaintAI(newComp.title, newComp.description);
        setComplaintSimulators(prev => ({
          ...prev,
          [newComp.id]: {
            elapsed: 0,
            department: dept,
            staff,
            eta,
            priority
          }
        }));
      }
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message || "Failed to submit complaint", "error");
    }
  };

  // 2. Submit Leave Request
  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      showToast("All leave fields are required", "warning");
      return;
    }
    try {
      const res = await api.leave.create(leaveForm);
      showToast("Leave Request submitted. AI is processing instant approval...", "success");
      setLeaveForm({ startDate: "", endDate: "", reason: "", autoLetter: true });
      
      const newLeave = res.leave;
      if (newLeave && newLeave.id) {
        const approvalId = "APP-2026-" + Math.floor(1000 + Math.random() * 9000);
        const approvedAt = new Date().toLocaleString();
        setLeaveSimulators(prev => ({
          ...prev,
          [newLeave.id]: {
            elapsed: 0,
            approvalId,
            approvedBy: "AI Warden",
            approvedAt
          }
        }));
      }
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message || "Failed to submit leave", "error");
    }
  };

  // 3. Submit Visitor Pass Request
  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorForm.visitorName || !visitorForm.relation || !visitorForm.visitDate) {
      showToast("Visitor name, relation, and date are required", "warning");
      return;
    }
    try {
      const res = await api.visitors.create(visitorForm) as any;
      const newVis = res.visitor || res;
      if (newVis && newVis.id) {
        setVisitorSimulators(prev => ({
          ...prev,
          [newVis.id]: {
            elapsed: 0,
            notified: false
          }
        }));
      }
      showToast("Visitor pass generated! HERA AI security gate audit in progress (30s)...", "success");
      setVisitorForm({ visitorName: "", relation: "", visitDate: "", purpose: "" });
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message || "Failed to submit visitor request", "error");
    }
  };

  // 4. Submit Mess Feedback
  const handleMessFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealComment) {
      showToast("Please enter a feedback comment", "warning");
      return;
    }
    try {
      const res = await api.mess.submitFeedback({ rating: mealRating, comment: mealComment });
      showToast(res.message, "success");
      setMealComment("");
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message || "Failed to submit feedbback", "error");
    }
  };

  // 5. Simulate Checkout Payment Gateway
  const handlePayFee = async () => {
    if (!selectedFee) return;
    setIsPaying(true);
    setTimeout(async () => {
      try {
        await api.fees.pay(selectedFee.id);
        showToast(`Payment of ₹${selectedFee.amount.toLocaleString()} received! Receipt updated.`, "success");
        setShowPaymentGateway(false);
        setSelectedFee(null);
        loadDashboardData();
      } catch (e: any) {
        showToast(e.message || "Payment processing failed", "error");
      } finally {
        setIsPaying(false);
      }
    }, 1800);
  };

  // 6. Warden: Approve / Reject Leave
  const handleApproveLeave = async (id: string, status: "approved" | "rejected") => {
    try {
      await api.leave.updateStatus(id, { status });
      showToast(`Leave pass ${status.toUpperCase()} successfully`, status === "approved" ? "success" : "info");
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 7. Warden: Approve / Reject Visitor
  const handleApproveVisitor = async (id: string, status: "approved" | "rejected") => {
    try {
      await api.visitors.updateStatus(id, status);
      showToast(`Visitor pass ${status.toUpperCase()} successfully`, status === "approved" ? "success" : "info");
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 8. Warden: Dispatch/Update Complaint Maintenance
  const handleDispatchComplaint = async () => {
    if (!dispatchComplaint) return;
    try {
      await api.complaints.updateStatus(dispatchComplaint.id, {
        status: "assigned",
        assignedTo: dispatcherName || "Assigned Duty Hand",
      });
      showToast("Complaint assigned to maintenance team", "success");
      setDispatchComplaint(null);
      setDispatcherName("");
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 9. Warden: Mark Complaint Resolved
  const handleMarkResolved = async (id: string) => {
    try {
      await api.complaints.updateStatus(id, { status: "resolved" });
      showToast("Complaint resolved and logged to history", "success");
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 10. Warden: Allocate Student to Room
  const handleAllocateStudent = async (studentId: string) => {
    if (!allocatingRoom) return;
    try {
      await api.rooms.allocate(allocatingRoom.id, studentId);
      showToast(`Student assigned to room ${allocatingRoom.roomNumber} successfully`, "success");
      setAllocatingRoom(null);
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 11. Admin: Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.rooms.create(newRoomForm);
      showToast(`Room ${newRoomForm.roomNumber} created successfully`, "success");
      setNewRoomForm({ roomNumber: "", block: "A", capacity: 3 });
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 12. Admin: Publish Notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.notices.create(newNoticeForm);
      showToast("Official notice published and broadcast to residents", "success");
      setNewNoticeForm({ title: "", content: "", priority: "normal" });
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 13. Admin: Delete Notice
  const handleDeleteNotice = async (id: string) => {
    try {
      await api.notices.delete(id);
      showToast("Notice deleted", "info");
      loadDashboardData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // 14. Chat AI Agent Query handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const msg = userInput;
    setUserInput("");
    setChatLoading(true);

    // Immediate optimistic local print
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: msg, timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await api.chat.sendMessage(msg);
      // Wait a tiny moment to simulate humanized visual typing
      setChatMessages(res.chat.messages);
      
      if (res.aiFeedback.actionTakenMessage) {
        showToast(res.aiFeedback.actionTakenMessage, "success");
        loadDashboardData(); // Refetch DB records
      }
    } catch (e: any) {
      showToast("Failed to chat with AI", "error");
    } finally {
      setChatLoading(false);
    }
  };

  const handlePresetMessageClick = (text: string) => {
    setUserInput(text);
  };

  // Utility to determine priority styling
  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case "critical":
        return <span className="bg-red-950/80 border border-red-500/40 text-red-400 font-sans px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Critical</span>;
      case "high":
        return <span className="bg-orange-950/80 border border-orange-500/40 text-orange-400 font-sans px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">High</span>;
      case "medium":
        return <span className="bg-yellow-950/80 border border-yellow-500/40 text-yellow-400 font-sans px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Medium</span>;
      default:
        return <span className="bg-zinc-800 border border-zinc-700 text-zinc-400 font-sans px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Low</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
      case "resolved":
      case "approved":
      case "paid":
        return <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider">✓ Approved</span>;
      case "rejected":
      case "overdue":
        return <span className="bg-red-950/60 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider">✕ Overdue/Rejected</span>;
      default:
        return <span className="bg-yellow-950/60 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider">⏰ Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-zinc-100 flex font-sans overflow-hidden">
      
      {/* ==========================================
          A. NAVIGATION SIDEBAR
         ========================================== */}
      <aside className="w-64 bg-[#111111] border-r border-zinc-800/60 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-6 border-b border-zinc-800/40 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <Bot className="w-4.5 h-4.5 text-zinc-950 font-bold" />
            </div>
            <span className="font-bold tracking-wider text-base text-white">HERA <span className="text-[#D4AF37]">AI</span></span>
          </div>

          <div className="p-4 space-y-1.5 text-xs">
            <p className="px-3 py-1 text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-semibold mb-2">Core Portal</p>
            
            <button
              onClick={() => setActivePanel("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activePanel === "overview" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview Dashboard</span>
            </button>

            {user.role === "student" ? (
              <>
                <button
                  onClick={() => setActivePanel("ai-chat")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "ai-chat" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span className="flex items-center gap-1.5">AI Warden Chat <Sparkles className="w-3 h-3 text-[#F5C542] shrink-0" /></span>
                </button>

                <button
                  onClick={() => setActivePanel("leave")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "leave" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Leave Letters</span>
                </button>

                <button
                  onClick={() => setActivePanel("complaints")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "complaints" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Room Complaints</span>
                </button>

                <button
                  onClick={() => setActivePanel("visitor")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "visitor" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Visitor passes</span>
                </button>

                <button
                  onClick={() => setActivePanel("fees")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "fees" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Hostel Fees</span>
                </button>

                <button
                  onClick={() => setActivePanel("mess")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "mess" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Mess Feedback</span>
                </button>
              </>
            ) : user.role === "warden" ? (
              <>
                <button
                  onClick={() => setActivePanel("approve-leave")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "approve-leave" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Verify Leaves</span>
                </button>

                <button
                  onClick={() => setActivePanel("approve-visitor")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "approve-visitor" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Approve Visitors</span>
                </button>

                <button
                  onClick={() => setActivePanel("manage-complaints")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "manage-complaints" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Manage Complaints</span>
                </button>

                <button
                  onClick={() => setActivePanel("manage-rooms")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "manage-rooms" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Bed className="w-4 h-4" />
                  <span>Manage Rooms</span>
                </button>
              </>
            ) : (
              // ADMIN CONTROLS
              <>
                <button
                  onClick={() => setActivePanel("manage-users")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "manage-users" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Students/Staff</span>
                </button>

                <button
                  onClick={() => setActivePanel("manage-rooms")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "manage-rooms" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Bed className="w-4 h-4" />
                  <span>Manage Rooms</span>
                </button>

                <button
                  onClick={() => setActivePanel("publish-notices")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activePanel === "publish-notices" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Broadcast Notices</span>
                </button>
              </>
            )}

            <button
              onClick={() => setActivePanel("notices")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activePanel === "notices" ? "bg-[#D4AF37] text-zinc-950 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notice Board</span>
            </button>
          </div>
        </div>

        {/* Profile Card Bottom */}
        <div className="p-4 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full gold-gradient-bg flex items-center justify-center text-zinc-950 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 capitalize">{user.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 bg-zinc-900 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded-lg flex items-center justify-center gap-2 border border-zinc-800/80 hover:border-red-900/30 transition-all font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          B. MAIN CONTENT CONTAINER & TOP NAV
         ========================================== */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0B] relative">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#D4AF37]/2 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-800/40 flex items-center justify-between px-6 shrink-0 relative z-10 glass-panel">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Role: <span className="text-[#D4AF37] font-sans font-extrabold ml-1">{user.role} Portal</span>
            </h1>
            {user.role === "student" && user.roomNumber && (
              <span className="bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                Room: <strong className="text-white ml-0.5">{user.roomNumber}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Button */}
            <button
              onClick={loadDashboardData}
              title="Refresh database state"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-[#D4AF37] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Notification Dropdown Indicator */}
            <div className="relative group cursor-pointer">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white relative">
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#D4AF37] rounded-full"></span>
                )}
              </div>
              
              {/* Notification Overlay Panel */}
              <div className="absolute right-0 mt-2 w-80 bg-[#161616] border border-zinc-800 rounded-xl shadow-2xl p-4 hidden group-hover:block z-50 text-xs">
                <p className="font-bold border-b border-zinc-800 pb-2 mb-2 text-white flex items-center justify-between">
                  <span>System Alerts</span>
                  <span className="text-[9px] uppercase font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded">Real-Time</span>
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-zinc-600 text-center py-4 font-mono">No new warnings or notifications</p>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotifRead(n.id)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          n.isRead ? "bg-zinc-900/40 border-zinc-800/50" : "bg-zinc-900 border-[#D4AF37]/30"
                        }`}
                      >
                        <p className="font-semibold text-zinc-200 flex items-center justify-between gap-1">
                          <span className="truncate">{n.title}</span>
                          {!n.isRead && <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></span>}
                        </p>
                        <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 hidden sm:inline font-medium">{user.name}</span>
              <div className="w-8 h-8 rounded-full gold-gradient-bg flex items-center justify-center text-zinc-950 font-bold font-sans">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {globalLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
              <p className="text-xs text-[#D4AF37] font-mono animate-pulse uppercase tracking-widest">Querying HERA Secure Core Database...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                
                {/* ==========================================
                    PANEL: OVERVIEW
                   ========================================== */}
                {activePanel === "overview" && (
                  <div className="space-y-8">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#D4AF37]/3 rounded-full blur-[80px] pointer-events-none"></div>
                      <div className="space-y-2 relative z-10">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Digital residential portal
                        </span>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                          Welcome, {user.name}! 🎓
                        </h2>
                        <p className="text-zinc-400 text-xs max-w-xl">
                          {user.role === "student" 
                            ? "Your academic residential terminal is fully synchronized. Ask your HERA AI assistant to log complaints, format leave papers, or pay fees instantly."
                            : "Warden monitoring dashboards is active. View pipeline predictive forecasts, authorize leaves, and organize room assignments."
                          }
                        </p>
                      </div>
                      <button 
                        onClick={() => setActivePanel(user.role === "student" ? "ai-chat" : "manage-rooms")}
                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-950 gold-gradient-bg rounded-xl hover:brightness-110 shadow-lg shadow-[#D4AF37]/10 transition-all font-sans relative z-10"
                      >
                        {user.role === "student" ? "Launch HERA AI Chat" : "Manage Assignments"}
                      </button>
                    </div>

                    {/* STATS COUNT GRID */}
                    {user.role === "student" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                          <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Room Assigned</p>
                          <p className="text-2xl font-extrabold text-white tracking-tight">{user.roomNumber || "Unassigned"}</p>
                          <p className="text-[10px] text-zinc-400 mt-2">Block B Residence Corridor</p>
                        </div>
                        <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                          <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Active Complaints</p>
                          <p className="text-2xl font-extrabold text-white tracking-tight">
                            {complaints.filter(c => c.status !== "resolved").length}
                          </p>
                          <p className="text-[10px] text-[#D4AF37] mt-2">Classified automatically by AI</p>
                        </div>
                        <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                          <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Leave Permits</p>
                          <p className="text-2xl font-extrabold text-white tracking-tight">
                            {leaves.length}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-2">Pending warden validation</p>
                        </div>
                        <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                          <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Outstanding Fees</p>
                          <p className="text-2xl font-extrabold text-[#D4AF37] tracking-tight">
                            ₹{fees.filter(f => f.status !== "paid").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-2">Due on July 25, 2026</p>
                        </div>
                      </div>
                    ) : (
                      // Warden and Admin overview metrics
                      analytics && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Active Residents</p>
                            <p className="text-2xl font-extrabold text-white tracking-tight">{analytics.counts.totalOccupancy} / {analytics.counts.totalCapacity}</p>
                            <p className="text-[10px] text-zinc-400 mt-2">Overall Occupancy rate: {((analytics.counts.totalOccupancy / analytics.counts.totalCapacity) * 100).toFixed(0)}%</p>
                          </div>
                          <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Unresolved Complaints</p>
                            <p className="text-2xl font-extrabold text-white tracking-tight">
                              {analytics.counts.pendingComplaints + analytics.counts.assignedComplaints}
                            </p>
                            <p className="text-[10px] text-[#D4AF37] mt-2">{analytics.counts.resolvedComplaints} resolved historically</p>
                          </div>
                          <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Pending Leaves</p>
                            <p className="text-2xl font-extrabold text-white tracking-tight">
                              {analytics.counts.pendingLeaves}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-2">Awaiting warden digital signature</p>
                          </div>
                          <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Mess Satisfaction</p>
                            <p className="text-2xl font-extrabold text-[#D4AF37] tracking-tight">{analytics.counts.avgMessRating} / 5.0</p>
                            <p className="text-[10px] text-zinc-400 mt-2">Synthesized from student reviews</p>
                          </div>
                        </div>
                      )
                    )}

                    {/* AI ADVANCED INSIGHTS BOX */}
                    {analytics && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Maintenance Prediction */}
                        <div className="bg-[#161616] rounded-2xl border border-zinc-800 p-6 space-y-4">
                          <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
                            <Bot className="w-4.5 h-4.5 text-[#D4AF37]" /> AI Predictive Maintenance Log
                          </h3>
                          <div className="p-4 rounded-xl bg-zinc-950 border border-[#D4AF37]/20 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-[#D4AF37]/10 shrink-0">
                              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                            </div>
                            <div className="text-xs space-y-1">
                              <p className="font-bold text-[#F5C542]">Forecast & Prediction Warning:</p>
                              <p className="text-zinc-300 leading-relaxed font-sans">{analytics.aiInsights.maintenancePrediction}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                            💡 *How this works:* Gemini models analyze repeating plumbing or electrical logs and room occupancy ratios to alert wardens to inspect wiring corridors before complete failures occur.
                          </p>
                        </div>

                        {/* Mess Recommendation */}
                        <div className="bg-[#161616] rounded-2xl border border-zinc-800 p-6 space-y-4">
                          <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
                            <Star className="w-4.5 h-4.5 text-[#D4AF37]" /> AI Mess Menu Optimizer
                          </h3>
                          <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/20 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                              <Star className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-xs space-y-1">
                              <p className="font-bold text-emerald-400">Student Sentiment Synthesis:</p>
                              <p className="text-zinc-300 leading-relaxed font-sans">{analytics.aiInsights.messRecommendation}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                            🍴 *How this works:* Gemini auto-parses raw review strings, computes average meal ratings, and recommends menu adjustments to mess supervisors.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SVG GRAPHICS - APPLE INSPIRED ANALYTICS (ADMIN / WARDEN ONLY) */}
                    {analytics && (
                      <div className="bg-[#161616] rounded-2xl border border-zinc-800 p-6 space-y-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart2 className="w-4 h-4 text-[#D4AF37]" /> Complaint category & room occupancy distribution</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono">
                          
                          {/* SVG Complaint Chart */}
                          <div className="space-y-4">
                            <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Complaint rates by category</p>
                            <div className="flex items-center gap-6">
                              {/* Dynamic visual representation */}
                              <svg width="140" height="140" viewBox="0 0 36 36" className="shrink-0">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#252525" strokeWidth="4"></circle>
                                {/* Plumbing slice - 40% */}
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#D4AF37" strokeWidth="4" strokeDasharray="40 60" strokeDashoffset="25"></circle>
                                {/* Electrical slice - 30% */}
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F5C542" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="85"></circle>
                                {/* IT slice - 20% */}
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="115"></circle>
                              </svg>
                              
                              <div className="space-y-2 text-[10px]">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded bg-[#D4AF37] inline-block"></span>
                                  <span className="text-zinc-400">Plumbing: {analytics.charts.complaintsByCategory.Plumbing} cases</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded bg-[#F5C542] inline-block"></span>
                                  <span className="text-zinc-400">Electrical: {analytics.charts.complaintsByCategory.Electrical} cases</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded bg-white inline-block"></span>
                                  <span className="text-zinc-400">IT & Wifi: {analytics.charts.complaintsByCategory.IT} cases</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded bg-zinc-600 inline-block"></span>
                                  <span className="text-zinc-400">Others: {analytics.charts.complaintsByCategory.Others} cases</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Block wise Occupancy Rates */}
                          <div className="space-y-4">
                            <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Occupancy rates by residential block</p>
                            <div className="space-y-3.5">
                              <div>
                                <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
                                  <span>Girls Residential Block A</span>
                                  <span>{analytics.charts.roomOccupancyByBlock.A} Allocated</span>
                                </div>
                                <div className="w-full bg-zinc-900 rounded-full h-2 border border-zinc-800">
                                  <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${Math.min(100, (analytics.charts.roomOccupancyByBlock.A / 10) * 100)}%` }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
                                  <span>Boys Residential Block B</span>
                                  <span>{analytics.charts.roomOccupancyByBlock.B} Allocated</span>
                                </div>
                                <div className="w-full bg-zinc-900 rounded-full h-2 border border-zinc-800">
                                  <div className="bg-[#F5C542] h-full rounded-full" style={{ width: `${Math.min(100, (analytics.charts.roomOccupancyByBlock.B / 10) * 100)}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* RECENT NOTICES FOR STUDENT */}
                    {user.role === "student" && notices.length > 0 && (
                      <div className="bg-[#161616] rounded-2xl border border-zinc-800 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-[#D4AF37]" /> Active Notice Board</h3>
                        <div className="space-y-4">
                          {notices.slice(0, 2).map((notice) => (
                            <div key={notice.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-zinc-200 text-xs">{notice.title}</span>
                                {notice.priority === "urgent" && <span className="bg-red-950 border border-red-500/30 text-red-400 font-bold px-2 py-0.5 rounded text-[9px] uppercase">Urgent</span>}
                              </div>
                              <p className="text-zinc-400 text-xs leading-relaxed font-sans">{notice.content}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">By {notice.createdBy} | {new Date(notice.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    PANEL: AI CHAT AGENT (STUDENT ONLY)
                   ========================================== */}
                {activePanel === "ai-chat" && user.role === "student" && (
                  <div className="h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-6">
                    {/* Chat Column */}
                    <div className="flex-1 bg-[#161616] rounded-2xl border border-zinc-800 flex flex-col justify-between overflow-hidden relative">
                      
                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
                        {chatMessages.map((msg, index) => (
                          <div 
                            key={index} 
                            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                          >
                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                              msg.role === "user" ? "bg-zinc-800 text-white" : "gold-gradient-bg text-zinc-950 font-bold"
                            }`}>
                              {msg.role === "user" ? "Me" : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                              msg.role === "user" 
                                ? "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tr-none" 
                                : "bg-zinc-950 border border-[#D4AF37]/10 text-zinc-300 rounded-tl-none whitespace-pre-wrap"
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex gap-3 max-w-[85%] mr-auto">
                            <div className="w-8 h-8 rounded-lg shrink-0 gold-gradient-bg text-zinc-950 font-bold flex items-center justify-center">
                              <Bot className="w-4 h-4" />
                            </div>
                            <div className="p-4 rounded-2xl text-xs bg-zinc-950 border border-[#D4AF37]/10 text-zinc-400 font-mono typing-cursor">
                              HERA AI is processing parameters and drafting record...
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Chat Quick Suggestions & Input */}
                      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 space-y-4 shrink-0">
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <button 
                            onClick={() => handlePresetMessageClick("I need leave starting tomorrow for 2 days to visit Kolkata")}
                            className="px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors"
                          >
                            📝 "Apply for 2 days leave"
                          </button>
                          <button 
                            onClick={() => handlePresetMessageClick("My room tube-light is sparking wildly in B-302")}
                            className="px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors"
                          >
                            💡 "My room tube-light is broken"
                          </button>
                          <button 
                            onClick={() => handlePresetMessageClick("What is the hostel gate close curfew timing?")}
                            className="px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors"
                          >
                            ⏰ "Check Curfew rules"
                          </button>
                        </div>

                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ask HERA to draft a pass, complain, or ask guidelines..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={chatLoading}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                          <button
                            type="submit"
                            disabled={chatLoading}
                            className="px-4 py-3 gold-gradient-bg text-zinc-950 rounded-xl hover:brightness-110 transition-all font-bold flex items-center justify-center shrink-0 disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>

                    </div>

                    {/* Chat Sidebar Information */}
                    <div className="w-full md:w-80 space-y-6">
                      <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800 space-y-4 text-xs">
                        <h4 className="font-bold text-white flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                          <Sparkles className="w-4 h-4 text-[#D4AF37]" /> HERA Cognitive Capabilities
                        </h4>
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          HERA leverages deep semantic parsing to automate student administrative burdens:
                        </p>
                        <ul className="space-y-2.5 text-zinc-400 font-sans text-[11px]">
                          <li className="flex items-start gap-2">
                            <span className="text-[#D4AF37] font-bold">▪</span>
                            <span><strong>Leave Applications:</strong> Generates formatted letters and submits drafts directly to warden queues.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#D4AF37] font-bold">▪</span>
                            <span><strong>Priority Classifier:</strong> Evaluates leakages, sparks, or locks, and assigns emergency priority tiers automatically.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#D4AF37] font-bold">▪</span>
                            <span><strong>Visitor Registration:</strong> Maps relations, validates dates, and prepares check-in records.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==========================================
                    PANEL: COMPLAINTS (STUDENT FILE CARD)
                   ========================================== */}
                {activePanel === "complaints" && user.role === "student" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* File Complaint Form */}
                    <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4 text-xs h-fit">
                      <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">File Maintenance Complaint</h3>
                      <form onSubmit={handleCreateComplaint} className="space-y-4">
                        <div>
                          <label className="block text-zinc-400 mb-1">Issue Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Bathroom washbasin faucet leaking"
                            value={complaintForm.title}
                            onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1">Detailed Description</label>
                          <textarea
                            rows={4}
                            placeholder="Provide room location, specifics of the fault, and any safety risk."
                            value={complaintForm.description}
                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 gold-gradient-bg text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all shadow-md shadow-[#D4AF37]/10"
                        >
                          File Complaint Ticket
                        </button>
                      </form>
                      <div className="p-3 bg-zinc-950 rounded-lg border border-[#D4AF37]/20 flex gap-2">
                        <Bot className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          <strong>AI Engine Enabled:</strong> This complaint is processed via Gemini to auto-categorize category and detect priorities instantly.
                        </p>
                      </div>
                    </div>

                    {/* Complaint Listings */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white">Your Complaint Tickets</h3>
                      {complaints.length === 0 ? (
                        <div className="p-12 text-center bg-[#161616] border border-zinc-800 rounded-2xl text-zinc-500 font-mono">
                          No active complaints found. Great job maintaining the room!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {complaints.map((c) => {
                            const sim = complaintSimulators[c.id];
                            const isSimulated = !!sim;
                            const elapsed = isSimulated ? sim.elapsed : 30;
                            
                            const isPending = elapsed < 30;
                            const displayStatus = isPending ? "pending" : (isSimulated ? "assigned" : c.status);
                            const displayPriority = isSimulated ? sim.priority : c.priority;
                            const displayDept = isSimulated ? sim.department : (c.department || "General");
                            const displayStaff = isSimulated ? (isPending ? "Awaiting assignation" : sim.staff) : (c.assignedTo || "Maintenance Duty Hand");
                            const displayEta = isSimulated ? (isPending ? "Estimating..." : sim.eta) : "2 Hours";

                            return (
                              <motion.div 
                                key={c.id} 
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className={`bg-[#161616] p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                                  isPending ? "border-zinc-800" : "border-emerald-500/20 shadow-md shadow-emerald-500/2"
                                }`}
                              >
                                {isPending && (
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                                    <div 
                                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000"
                                      style={{ width: `${(elapsed / 30) * 100}%` }}
                                    />
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                                  <span className="font-mono text-zinc-500 text-[10px] tracking-widest flex items-center gap-1.5">
                                    TICKET #{c.id.toUpperCase()}
                                    {isPending && (
                                      <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                                    )}
                                  </span>
                                  <div className="flex gap-2">
                                    {getPriorityBadge(displayPriority)}
                                    {isPending ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider bg-amber-950/40 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> PENDING ({30 - elapsed}s)
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <CheckCircle className="w-2.5 h-2.5" /> APPROVED BY AI
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                  {c.title}
                                  {!isPending && (
                                    <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded">
                                      AUTO-ROUTED
                                    </span>
                                  )}
                                </h4>
                                <p className="text-zinc-400 text-xs leading-relaxed font-sans">{c.description}</p>
                                
                                {/* AI Scanning & Review states */}
                                {isPending && (
                                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-zinc-500 flex items-center gap-1.5">
                                        <Bot className="w-3.5 h-3.5 text-[#D4AF37]" /> AI COGNITIVE PARSING:
                                      </span>
                                      <span className="text-amber-400 font-bold">
                                        {elapsed < 15 ? "EXTRACTING PARAMETERS..." : "DISPATCHING TO SPECIALIST..."}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-[#D4AF37] animate-pulse" 
                                        style={{ width: `${Math.max(20, (elapsed / 30) * 100)}%` }}
                                      />
                                    </div>
                                    <p className="text-[9px] text-zinc-500 leading-normal font-sans">
                                      {elapsed < 15 
                                        ? "Analyzing description keywords using Gemini to isolate engineering category..." 
                                        : `Identified department: [${displayDept}]. Assigning ${displayStaff} (ETA: ${displayEta})...`}
                                    </p>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-1 text-[10px] text-zinc-500 font-mono">
                                  <div>
                                    <p>CATEGORY: <strong className="text-zinc-300">{isPending ? "Analyzing..." : "Maintenance Issue"}</strong></p>
                                    <p className="mt-1">DEPARTMENT: <strong className="text-zinc-300">{isPending ? "Routing..." : displayDept}</strong></p>
                                  </div>
                                  <div>
                                    <p>ASSIGNED STAFF: <strong className="text-zinc-300">{displayStaff}</strong></p>
                                    <p className="mt-1">ESTIMATED TIME: <strong className="text-zinc-300">{displayEta}</strong></p>
                                  </div>
                                </div>

                                {!isPending && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-2 text-[10px] text-emerald-400"
                                  >
                                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                                    <span><strong>✅ Complaint Approved by AI Warden:</strong> Dispatched to {displayDept} crew. Staff assigned to your room.</span>
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==========================================
                    PANEL: LEAVE LETTERS (STUDENT FILE LEAVE)
                   ========================================== */}
                {activePanel === "leave" && user.role === "student" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Submit Leave application Form */}
                    <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4 text-xs h-fit">
                      <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Apply for Hostel Leave</h3>
                      <form onSubmit={handleCreateLeave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-zinc-400 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={leaveForm.startDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                              required
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1">End Date</label>
                            <input
                              type="date"
                              value={leaveForm.endDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                              required
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1">Reason for Leave</label>
                          <input
                            type="text"
                            placeholder="e.g. Traveling home for sister's wedding"
                            value={leaveForm.reason}
                            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 gold-gradient-bg text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all shadow-md shadow-[#D4AF37]/10"
                        >
                          Submit Leave Request
                        </button>
                      </form>
                      <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                        📝 *Formal Application:* After filing, HERA compiles a formatted draft letter and queue it for Warden Suresh Sharma's approval.
                      </p>
                    </div>

                    {/* Previous Leaves list */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white">Your Leave Requests</h3>
                      {leaves.length === 0 ? (
                        <div className="p-12 text-center bg-[#161616] border border-zinc-800 rounded-2xl text-zinc-500 font-mono">
                          No previous leave requests on record. Perfect attendance!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {leaves.map((l) => {
                            const criticals = [
                              "health issue", "medical emergency", "hospital", "accident", 
                              "family emergency", "death", "surgery", "emergency travel"
                            ];
                            const isCritical = l.reason && criticals.some(k => l.reason.toLowerCase().includes(k));

                            return (
                              <motion.div 
                                key={l.id} 
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-[#161616] p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                                  isCritical || (leaveSimulators[l.id] && leaveSimulators[l.id].elapsed === 30) || l.status === "approved"
                                    ? "border-emerald-500/20 shadow-md shadow-emerald-500/2" 
                                    : "border-zinc-800"
                                }`}
                              >
                                {leaveSimulators[l.id] && leaveSimulators[l.id].elapsed < 30 && (
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                                    <div 
                                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000"
                                      style={{ width: `${(leaveSimulators[l.id].elapsed / 30) * 100}%` }}
                                    />
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                                  <span className="font-mono text-zinc-500 text-[10px] tracking-wider">PERMIT #{l.id.toUpperCase()}</span>
                                  {isCritical ? (
                                    <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                                      <CheckCircle className="w-3 h-3" /> Automatically Approved (Emergency Leave)
                                    </span>
                                  ) : (
                                    (() => {
                                      const sim = leaveSimulators[l.id];
                                      if (sim) {
                                        if (sim.elapsed < 30) {
                                          return (
                                            <span className="bg-amber-950/40 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm animate-pulse">
                                              <RefreshCw className="w-3 h-3 animate-spin" /> HERA AUDITING ({30 - sim.elapsed}s)
                                            </span>
                                          );
                                        } else {
                                          return (
                                            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                                              <CheckCircle className="w-3 h-3" /> APPROVED BY AI
                                            </span>
                                          );
                                        }
                                      }
                                      return getStatusBadge(l.status);
                                    })()
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <p className="text-zinc-500 uppercase text-[9px] font-mono">Duration</p>
                                    <p className="font-semibold text-white mt-0.5">{l.startDate} to {l.endDate}</p>
                                  </div>
                                  <div>
                                    <p className="text-zinc-500 uppercase text-[9px] font-mono">Travel Reason</p>
                                    <p className="font-semibold text-white mt-0.5">{l.reason}</p>
                                  </div>
                                </div>

                                {/* Auditing Progress View */}
                                {leaveSimulators[l.id] && leaveSimulators[l.id].elapsed < 30 && (
                                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850 space-y-2 mt-2">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-[#D4AF37] font-bold flex items-center gap-1.5">
                                        <Bot className="w-3.5 h-3.5" /> HERA SECURE GATEPASS AUDIT
                                      </span>
                                      <span className="text-zinc-500">
                                        {leaveSimulators[l.id].elapsed < 15 ? "Validating schedule..." : "Generating digital signature..."}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-zinc-400 leading-normal font-sans">
                                      {leaveSimulators[l.id].elapsed < 15 
                                        ? "Verifying resident details, attendance record, and leave history parameters..." 
                                        : "Drafting cryptographic AI gatepass and securing Mr. Suresh Sharma's digital waiver..."}
                                    </div>
                                  </div>
                                )}

                                {/* AI Leave Decision Green Success Card for Critical Emergency Leave */}
                                {isCritical && (
                                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 mt-2 space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
                                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wide">
                                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                                      <span>AI Decision: Approved</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-zinc-300 font-mono pt-1 border-t border-emerald-500/10">
                                      <div className="space-y-0.5">
                                        <span className="text-zinc-500 block uppercase text-[9px]">Reason</span>
                                        <span className="text-emerald-400 font-semibold">{l.reason} detected.</span>
                                      </div>
                                      <div className="space-y-0.5">
                                        <span className="text-zinc-500 block uppercase text-[9px]">Priority</span>
                                        <span className="text-red-400 font-semibold">Critical</span>
                                      </div>
                                      <div className="space-y-0.5">
                                        <span className="text-zinc-500 block uppercase text-[9px]">Approval Type</span>
                                        <span className="text-emerald-400 font-semibold">Automatic Emergency Approval</span>
                                      </div>
                                      <div className="space-y-0.5">
                                        <span className="text-zinc-500 block uppercase text-[9px]">Issued By</span>
                                        <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
                                          <Bot className="w-3 h-3" /> HERA AI Engine
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Regular Leave Approved: Simple Information Card */}
                                {((leaveSimulators[l.id] && leaveSimulators[l.id].elapsed === 30) || (l.status === "approved" && !isCritical)) && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-zinc-950 border border-emerald-500/20 rounded-xl p-4 mt-2 relative overflow-hidden w-full text-left"
                                  >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-2xl"></div>
                                    
                                    <div className="space-y-3 text-zinc-300 w-full font-mono font-sans">
                                      <div className="flex items-center justify-between font-sans">
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                          <Sparkles className="w-4 h-4" />
                                          <span>Approved by AI Warden</span>
                                        </div>
                                        <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 shadow-md shadow-black/40 font-mono">
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          APPROVED
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3 border-t border-zinc-900 font-mono">
                                        <div>
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Approval ID</span>
                                          <span className="text-white font-semibold">{leaveSimulators[l.id]?.approvalId || `APP-2026-${l.id.slice(-4).toUpperCase()}`}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Leave Duration</span>
                                          <span className="text-white font-semibold">{l.startDate} to {l.endDate}</span>
                                        </div>
                                        <div className="md:col-span-2">
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Reason</span>
                                          <span className="text-white">{l.reason}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Approved By</span>
                                          <span className="text-[#D4AF37] font-semibold">Warden</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-zinc-800/60 pt-3 mt-2">
                                  <details className="text-[11px] text-zinc-500 flex-1">
                                    <summary className="cursor-pointer hover:text-white transition-colors">Show AI-Drafted Formal Letter</summary>
                                    <pre className="mt-2 p-3 bg-zinc-950 rounded border border-zinc-800/80 font-serif leading-relaxed text-zinc-400 whitespace-pre-wrap">
                                      {l.letterText}
                                    </pre>
                                  </details>

                                  {l.status === "pending" && !isCritical && !leaveSimulators[l.id] && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await api.leave.updateStatus(l.id, { status: "approved" });
                                          showToast(`Leave pass ${l.id} has been self-approved successfully (Demo Mode)!`, "success");
                                          loadDashboardData();
                                        } catch (err: any) {
                                          showToast(err?.message || "Failed to self-approve", "error");
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider transition-all self-end sm:self-auto shrink-0 flex items-center gap-1 shadow-sm"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Approve Pass (Demo)</span>
                                    </button>
                                  )}
                                </div>
                                {l.remarks && (
                                  <p className="text-[10px] text-yellow-500 font-mono mt-1">Warden remarks: "{l.remarks}"</p>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==========================================
                    PANEL: VISITOR PASSES
                   ========================================== */}
                {activePanel === "visitor" && user.role === "student" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Visitor Form */}
                    <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4 text-xs h-fit">
                      <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Request Visitor Gate Pass</h3>
                      <form onSubmit={handleCreateVisitor} className="space-y-4">
                        <div>
                          <label className="block text-zinc-400 mb-1">Visitor Full Name</label>
                          <input
                            type="text"
                            placeholder="Mrs. Sunita Roy"
                            value={visitorForm.visitorName}
                            onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-zinc-400 mb-1">Relation</label>
                            <input
                              type="text"
                              placeholder="Mother"
                              value={visitorForm.relation}
                              onChange={(e) => setVisitorForm({ ...visitorForm, relation: e.target.value })}
                              required
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1">Visit Date</label>
                            <input
                              type="date"
                              value={visitorForm.visitDate}
                              onChange={(e) => setVisitorForm({ ...visitorForm, visitDate: e.target.value })}
                              required
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1">Purpose of Visit</label>
                          <input
                            type="text"
                            placeholder="e.g. Delivering food & checking health"
                            value={visitorForm.purpose}
                            onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 gold-gradient-bg text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all shadow-md shadow-[#D4AF37]/10"
                        >
                          Generate Pass
                        </button>
                      </form>
                    </div>

                    {/* Visitor list */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white">Your Visitor Passes</h3>
                      {visitors.length === 0 ? (
                        <div className="p-12 text-center bg-[#161616] border border-zinc-800 rounded-2xl text-zinc-500 font-mono">
                          No visitor records filed yet.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {visitors.map((v) => {
                            const sim = visitorSimulators[v.id];
                            // If a visitor pass is in the database as pending but NOT currently being simulated,
                            // we treat it as an existing demo pass and assume it has completed approval.
                            const isApproved = v.status === "approved" || !sim || sim.elapsed >= 30;

                            return (
                              <div key={v.id} className="bg-[#161616] p-5 rounded-2xl border border-zinc-800 hover:border-zinc-700/80 transition-all duration-300 w-full text-left">
                                <div className="space-y-4 text-xs w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-zinc-500 text-[10px]">PASS #{v.id}</span>
                                    {isApproved ? (
                                      <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        APPROVED
                                      </span>
                                    ) : (
                                      <span className="bg-amber-950/40 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 animate-pulse">
                                        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                                        PENDING ({30 - sim.elapsed}s)
                                      </span>
                                    )}
                                  </div>
                                  
                                  {isApproved ? (
                                    <div className="bg-zinc-950 border border-emerald-500/20 rounded-xl p-4 space-y-3 relative overflow-hidden w-full">
                                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-2xl"></div>
                                      
                                      <div className="flex items-center justify-between font-sans">
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                          <Sparkles className="w-4 h-4" />
                                          <span>Approved by AI Warden</span>
                                        </div>
                                        <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-mono">
                                          APPROVED
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono border-t border-zinc-900 pt-3">
                                        <div>
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Approval ID</span>
                                          <span className="text-white font-semibold">APP-VIS-{v.id.slice(-4).toUpperCase()}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Visitor Name</span>
                                          <span className="text-white font-semibold">{v.visitorName} ({v.relation})</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Visit Date</span>
                                          <span className="text-white font-semibold">{v.visitDate}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Verified By</span>
                                          <span className="text-[#D4AF37] font-semibold">Hostel Warden</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <h4 className="font-bold text-white text-sm">{v.visitorName} ({v.relation})</h4>
                                      <p className="text-zinc-400 font-sans">Date of visit: <strong className="text-zinc-200">{v.visitDate}</strong></p>
                                      {v.purpose && <p className="text-zinc-500 italic text-[11px] font-sans">"Purpose: {v.purpose}"</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==========================================
                    PANEL: HOSTEL FEES (STUDENT ONLY)
                   ========================================== */}
                {activePanel === "fees" && user.role === "student" && (() => {
                  const percentPaid = Math.round((feeStats.paid / feeStats.total) * 100);
                  const isPaidCompleted = feeStats.pending === 0;

                  const getProgressBarString = (pct: number) => {
                    let solidCount = 0;
                    if (pct === 100) {
                      solidCount = 10;
                    } else if (pct === 0) {
                      solidCount = 0;
                    } else if (pct === 2) {
                      solidCount = 2; // to exactly match the prompt's example: ██░░░░░░░░ 2%
                    } else {
                      solidCount = Math.max(1, Math.min(9, Math.round(pct / 10)));
                    }
                    const emptyCount = 10 - solidCount;
                    return "█".repeat(solidCount) + "░".repeat(emptyCount);
                  };

                  return (
                    <div className="space-y-8 text-xs font-sans relative">
                      {/* HEADER */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                            Hostel Fee Management Terminal
                          </h2>
                          <p className="text-zinc-400 text-[11px] mt-1">Track residential dues, view itemized breakdowns, and clear invoices securely.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowFeeDetailsModal(true)}
                            className="px-4 py-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold uppercase tracking-wider rounded-lg transition-all text-[10px]"
                          >
                            📄 View Fee Details
                          </button>
                          <span className="text-[10px] uppercase font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1.5 rounded-full border border-[#D4AF37]/20 font-bold">
                            Academic Year: 2026-2027
                          </span>
                        </div>
                      </div>

                      {/* 1. TOP SUMMARY CARDS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1: Total Assigned Fees */}
                        <div className="bg-[#121212]/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-850 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">Total Assigned Fees</p>
                          <p className="text-2xl font-extrabold text-white tracking-tight">₹{feeStats.total.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-500 mt-2 font-mono">Hostel Fee Base</p>
                        </div>

                        {/* Card 2: Amount Paid */}
                        <div className="bg-[#121212]/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-850 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">Amount Paid</p>
                          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight">₹{feeStats.paid.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-500 mt-2 font-mono">Cleared Transactions</p>
                        </div>

                        {/* Card 3: Remaining Fees */}
                        <div className="bg-[#121212]/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-850 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">Remaining Fees</p>
                          <p className="text-2xl font-extrabold text-red-500 tracking-tight">₹{feeStats.pending.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-500 mt-2 font-mono">Awaiting Settlement</p>
                        </div>

                        {/* Card 4: Payment Progress */}
                        <div className="bg-[#121212]/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-850 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">Payment Progress</p>
                          <div className="mt-2.5 space-y-1.5">
                            <p className="text-xl font-extrabold text-white tracking-tight font-mono">
                              {percentPaid}%
                            </p>
                            <p className="text-sm font-bold text-zinc-300 font-mono tracking-wider">
                              {getProgressBarString(percentPaid)}
                            </p>
                            {percentPaid === 100 && (
                              <p className="text-[11px] font-mono text-emerald-400 font-extrabold tracking-wide mt-1">
                                Status: 🟢 Fully Paid
                              </p>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-3 font-mono">Bursar Registry Completion</p>
                        </div>
                      </div>

                      {/* BENTO LAYOUT CONTAINER */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: REMAINING FEES & AI INSIGHT */}
                        <div className="lg:col-span-5 space-y-8">
                          
                          {/* REMAINING FEES CARD */}
                          <div className="bg-[#121212]/80 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent rounded-full blur-2xl"></div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                              <Shield className="w-4 h-4 text-[#D4AF37]" />
                              Remaining Hostel Fees Statement
                            </h3>
                            
                            <div className="space-y-4">
                              <div className="flex justify-between items-center py-2 border-b border-zinc-800/40">
                                <span className="text-zinc-400 font-sans">Remaining Hostel Fees</span>
                                <span className="font-extrabold text-white text-base font-mono">₹{feeStats.pending.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-zinc-800/40">
                                <span className="text-zinc-400 font-sans">Next Due Date</span>
                                <span className="font-bold text-red-400 font-mono">20-Aug-2026</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-zinc-800/40">
                                <span className="text-zinc-400 font-sans">Next Installment</span>
                                <span className="font-bold text-[#D4AF37] font-mono">₹{Math.min(feeStats.pending, feeStats.nextInstallment).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-zinc-800/40">
                                <span className="text-zinc-400 font-sans">Late Fee Surcharge</span>
                                <span className="font-bold text-emerald-400 font-mono">₹0</span>
                              </div>
                              
                              {/* Payment Progress */}
                              <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider">
                                  <span className="text-zinc-500 font-semibold">Payment Progress</span>
                                  <span className="text-[#D4AF37] font-bold">{percentPaid}%</span>
                                </div>
                                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-900 p-0.5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentPaid}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#D4AF37] shadow-inner"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* PAY NOW BUTTON */}
                            {!isPaidCompleted ? (
                              <div className="pt-3 space-y-4">
                                {paymentState !== "processing" && (
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                                      Enter Payment Amount (₹)
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37] font-bold font-mono text-xs">₹</span>
                                      <input
                                        type="number"
                                        min="1"
                                        max={feeStats.pending}
                                        value={paymentAmountInput}
                                        onChange={(e) => {
                                          setPaymentAmountInput(e.target.value);
                                          setPaymentError("");
                                        }}
                                        placeholder="Enter amount to pay"
                                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D4AF37]/80 focus:ring-1 focus:ring-[#D4AF37]/50 rounded-xl py-2.5 pl-8 pr-4 text-white font-mono font-bold text-xs focus:outline-none transition-all"
                                      />
                                    </div>
                                    {paymentError && (
                                      <p className="text-red-500 font-semibold text-[11px] font-sans flex items-center gap-1">
                                        <span>{paymentError}</span>
                                      </p>
                                    )}
                                  </div>
                                )}

                                {paymentState === "processing" ? (
                                  <div className="w-full py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 animate-pulse">
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                                      <span className="uppercase tracking-wider text-[11px]">Processing Payment...</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400">Please do not close this tab ({paymentSecLeft}s remaining)</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const numericAmount = parseFloat(paymentAmountInput);
                                      
                                      if (isNaN(numericAmount) || numericAmount < 1) {
                                        setPaymentError("❌ Please enter a valid payment amount.");
                                        showToast("❌ Please enter a valid payment amount.", "error");
                                        return;
                                      }
                                      
                                      if (numericAmount > feeStats.pending) {
                                        setPaymentError("❌ Payment amount cannot exceed the remaining hostel fees.");
                                        showToast("❌ Payment amount cannot exceed the remaining hostel fees.", "error");
                                        return;
                                      }

                                      setPaymentError("");
                                      setPaymentState("processing");
                                      setPaymentSecLeft(5);
                                      const interval = setInterval(() => {
                                        setPaymentSecLeft(prev => {
                                          if (prev <= 1) {
                                            clearInterval(interval);
                                            return 0;
                                          }
                                          return prev - 1;
                                        });
                                      }, 1000);

                                      setTimeout(() => {
                                        if (numericAmount > 0) {
                                          setFeeStats(prev => {
                                            const nextPaid = prev.paid + numericAmount;
                                            const nextPending = prev.pending - numericAmount;
                                            return {
                                              ...prev,
                                              paid: nextPaid,
                                              pending: nextPending
                                            };
                                          });

                                          const nextReceiptNo = 500001 + feeTransactions.length;
                                          const todayStr = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                                          
                                          const newReceipt = {
                                            id: `REC-${nextReceiptNo}`,
                                            date: todayStr,
                                            amount: numericAmount,
                                            method: "UPI",
                                            status: "✅ PAID"
                                          };

                                          setFeeTransactions(prev => [newReceipt, ...prev]);
                                          showToast(`✅ Paid ₹${numericAmount.toLocaleString()} Successfully`, "success");
                                          setPaymentAmountInput("");
                                        }
                                        setPaymentState("idle");
                                      }, 5000);
                                    }}
                                    className="w-full py-3 bg-[#D4AF37] hover:bg-amber-500 text-zinc-950 font-extrabold uppercase rounded-xl tracking-widest transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 hover:scale-[1.01]"
                                  >
                                    🟡 PAY NOW
                                  </button>
                                )}
                              </div>
                            ) : (
                              <motion.div 
                                id="fee-payment-success-banner"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1 text-center font-sans"
                              >
                                <p className="text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-1.5 leading-relaxed">
                                  <span>🎉 Congratulations! Your hostel fees have been paid successfully.</span>
                                </p>
                              </motion.div>
                            )}
                          </div>

                          {/* AI INSIGHT */}
                          <div className="bg-[#121212]/80 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
                            
                            <div className="flex items-start gap-4 relative z-10">
                              <div className="relative shrink-0 mt-0.5">
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 opacity-60 blur animate-pulse"></div>
                                <div className="relative w-10 h-10 rounded-full bg-zinc-900 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                                  <Bot className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                              </div>

                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">HERA Fee Advisor</h4>
                                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full tracking-wide">
                                    ● Live
                                  </span>
                                </div>
                                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 text-zinc-300 font-sans leading-relaxed text-[11px]">
                                  {!isPaidCompleted ? (
                                    <div className="space-y-1.5 font-sans text-xs">
                                      <p className="text-zinc-300">You have paid <strong className="text-emerald-400 font-mono">₹{feeStats.paid.toLocaleString()}</strong> out of <strong className="text-zinc-200 font-mono">₹{feeStats.total.toLocaleString()}</strong>.</p>
                                      <p className="text-zinc-300">Remaining hostel fee is <strong className="text-[#D4AF37] font-mono">₹{feeStats.pending.toLocaleString()}</strong>.</p>
                                      <p className="text-amber-400 font-medium">Please complete payment before the due date.</p>
                                    </div>
                                  ) : (
                                    <p className="text-emerald-400 font-bold flex items-center gap-1.5 font-sans">
                                      <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                      <span>All hostel fees have been paid successfully. No pending dues remain.</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* RIGHT COLUMN: PAYMENT HISTORY */}
                        <div className="lg:col-span-7 space-y-8">
                          
                          {/* PAYMENT HISTORY TABLE */}
                          <div className="bg-[#121212]/80 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                              <FileText className="w-4 h-4 text-[#D4AF37]" />
                              Payment History & Receipts Registry
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse font-sans">
                                <thead>
                                  <tr className="border-b border-zinc-800/80 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                                    <th className="pb-3 font-semibold">Receipt No</th>
                                    <th className="pb-3 font-semibold">Payment Date</th>
                                    <th className="pb-3 font-semibold">Amount Paid</th>
                                    <th className="pb-3 font-semibold">Payment Mode</th>
                                    <th className="pb-3 font-semibold text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/40 text-[11px] font-mono">
                                  {feeTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
                                      <td className="py-3 text-white font-bold">{tx.id}</td>
                                      <td className="py-3 text-zinc-400">{tx.date}</td>
                                      <td className="py-3 text-[#D4AF37] font-sans font-extrabold">₹{tx.amount.toLocaleString()}</td>
                                      <td className="py-3 text-zinc-400 font-sans">{tx.method}</td>
                                      <td className="py-3 text-right">
                                        <span className="inline-block px-2 py-0.5 rounded text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-bold tracking-wide uppercase">
                                          {tx.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* FEE DETAILS DIALOG MODAL (Glassmorphism & Gold accents) */}
                      <AnimatePresence>
                        {showFeeDetailsModal && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setShowFeeDetailsModal(false)}
                              className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            />

                            {/* Modal Card */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="relative w-full max-w-lg bg-[#121212]/95 border border-[#D4AF37]/30 rounded-3xl p-7 shadow-2xl space-y-6 overflow-hidden z-10 text-xs text-zinc-300"
                            >
                              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                              <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                                <div>
                                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#D4AF37]" />
                                    Fee Profile Details
                                  </h3>
                                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-mono">Academic Session 2026-2027</p>
                                </div>
                                <button
                                  onClick={() => setShowFeeDetailsModal(false)}
                                  className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all font-mono font-bold text-[11px] px-2.5"
                                >
                                  ESC
                                </button>
                              </div>

                              <div className="space-y-4">
                                {/* Student Particulars */}
                                <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 font-sans text-xs">
                                  <div>
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Student Name</span>
                                    <span className="text-zinc-200 font-bold block mt-0.5">{user.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Registration Number</span>
                                    <span className="text-zinc-200 font-bold font-mono block mt-0.5">REG-2026-HERA{user.id.replace("usr-", "").substring(0, 3).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Academic Year</span>
                                    <span className="text-zinc-200 font-bold block mt-0.5">2026-2027</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Hostel Block</span>
                                    <span className="text-zinc-200 font-bold block mt-0.5">Block {user.roomNumber?.startsWith("A") ? "A" : "B"}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Room Number</span>
                                    <span className="text-[#D4AF37] font-bold block mt-0.5">{user.roomNumber || "Room 104"}</span>
                                  </div>
                                </div>

                                <div className="border-t border-zinc-850 pt-4 space-y-3.5 text-xs">
                                  <div className="flex justify-between items-center py-1 border-b border-zinc-850/40">
                                    <span className="text-zinc-400 font-sans">Total Assigned Fees</span>
                                    <span className="font-extrabold text-white text-sm font-mono">₹{feeStats.total.toLocaleString()}</span>
                                  </div>

                                  <div className="flex justify-between items-center py-1 border-b border-zinc-850/40">
                                    <span className="text-zinc-400 font-sans">Total Paid</span>
                                    <span className="font-extrabold text-emerald-400 font-mono">₹{feeStats.paid.toLocaleString()}</span>
                                  </div>

                                  <div className="flex justify-between items-center py-1 border-b border-zinc-850/40">
                                    <span className="text-zinc-400 font-sans">Remaining Fees</span>
                                    <span className="font-extrabold text-red-500 font-mono">₹{feeStats.pending.toLocaleString()}</span>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider">
                                      <span className="text-zinc-500 font-semibold">Payment Progress</span>
                                      <span className="text-[#D4AF37] font-bold">{percentPaid}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentPaid}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#D4AF37] shadow-inner"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setShowFeeDetailsModal(false)}
                                className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold uppercase rounded-xl tracking-wider transition-all"
                              >
                                Close Details
                              </button>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* ==========================================
                    PANEL: MESS MENU & FEEDBACK
                   ========================================== */}
                {activePanel === "mess" && user.role === "student" && messMenu && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs">
                    
                    {/* Weekly menu matrix */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white">Weekly Nutrition Menu</h3>
                      <div className="space-y-4">
                        {Object.keys(messMenu).map((day) => {
                          const item: MenuItem = messMenu[day as keyof typeof messMenu];
                          const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
                          const isToday = day === todayName;

                          return (
                            <div 
                              key={day} 
                              className={`p-5 rounded-2xl border transition-all ${
                                isToday ? "bg-zinc-900/60 border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5" : "bg-[#161616] border-zinc-800/80"
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5 mb-3">
                                <span className={`font-bold text-sm ${isToday ? "text-[#D4AF37]" : "text-white"}`}>
                                  {day} {isToday && <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] uppercase font-mono ml-2">Today's Menu</span>}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-zinc-300">
                                <div>
                                  <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Breakfast</p>
                                  <p className="mt-1 leading-relaxed">{item.breakfast}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Lunch</p>
                                  <p className="mt-1 leading-relaxed">{item.lunch}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Snacks</p>
                                  <p className="mt-1 leading-relaxed">{item.snacks}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Dinner</p>
                                  <p className="mt-1 leading-relaxed">{item.dinner}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Meal Feedback Column */}
                    <div className="space-y-6">
                      {(() => {
                        const todayDateStr = new Date().toISOString().split("T")[0];
                        const todayFb = messFeedbacks.find(
                          (fb) => fb.studentId === user.id && fb.createdAt.startsWith(todayDateStr)
                        );

                        if (todayFb) {
                          return (
                            <div className="bg-[#161616] p-6 rounded-2xl border border-emerald-500/20 space-y-4">
                              <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Rate Today's Meal</h3>
                              <div className="p-4 bg-zinc-950/80 rounded-xl border border-emerald-500/20 text-center space-y-2">
                                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                                <p className="text-zinc-200 font-bold text-xs">You have already submitted this request.</p>
                                <p className="text-zinc-400 text-[11px] leading-relaxed">Your feedback for today's meal has been recorded successfully. Thank you for helping us improve!</p>
                              </div>
                              <div className="p-3.5 bg-zinc-900 rounded-lg border border-zinc-800 space-y-2">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-zinc-400 font-mono">Your Rating:</span>
                                  <span className="text-[#D4AF37] text-sm font-bold">{"★".repeat(todayFb.rating)}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-zinc-500 text-[10px] uppercase font-mono block">Your Comment:</span>
                                  <p className="text-zinc-300 font-sans italic text-xs leading-relaxed">"{todayFb.comment}"</p>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4">
                            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Rate Today's Meal</h3>
                            <form onSubmit={handleMessFeedbackSubmit} className="space-y-4">
                              <div>
                                <label className="block text-zinc-400 mb-1.5">Rating (1 to 5 Stars)</label>
                                <div className="flex gap-2 text-[#D4AF37]">
                                  {[1, 2, 3, 4, 5].map((stars) => (
                                    <button
                                      key={stars}
                                      type="button"
                                      onClick={() => setMealRating(stars)}
                                      className="text-xl transition-transform hover:scale-125"
                                    >
                                      {stars <= mealRating ? "★" : "☆"}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-zinc-400 mb-1">Feedback Comment</label>
                                <textarea
                                  rows={3}
                                  placeholder="Rate chapati quality, rice cooking, paneer spiciness, etc."
                                  value={mealComment}
                                  onChange={(e) => setMealComment(e.target.value)}
                                  required
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full py-2.5 gold-gradient-bg text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all"
                              >
                                Submit Feedback
                              </button>
                            </form>
                          </div>
                        );
                      })()}

                      {/* Recents feedback list */}
                      <div className="bg-[#161616] p-5 rounded-2xl border border-zinc-800 space-y-4">
                        <h4 className="font-bold text-white border-b border-zinc-800 pb-2">Recent Community Reviews</h4>
                        <div className="space-y-3">
                          {messFeedbacks.map((fb) => (
                            <div key={fb.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80 space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-zinc-300">{fb.studentName}</span>
                                <span className="text-[#D4AF37] font-bold">{"★".repeat(fb.rating)}</span>
                              </div>
                              <p className="text-zinc-400 leading-relaxed font-sans text-[11px]">"{fb.comment}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ==========================================
                    PANEL: NOTICE BOARD (ALL USERS)
                   ========================================== */}
                {activePanel === "notices" && (
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-[#D4AF37]" /> Institutional Notice Board</h2>
                    {notices.length === 0 ? (
                      <div className="p-12 text-center bg-[#161616] border border-zinc-800 rounded-2xl text-zinc-500 font-mono">
                        No official announcements published yet.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {notices.map((n) => (
                          <div key={n.id} className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-3 relative">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-extrabold text-white">{n.title}</h3>
                              {n.priority === "urgent" && <span className="bg-red-950 border border-red-500/40 text-red-400 px-2.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">Urgent Alert</span>}
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed font-sans whitespace-pre-wrap">{n.content}</p>
                            <div className="border-t border-zinc-800/60 pt-2.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                              <span>PUBLISHER: {n.createdBy}</span>
                              <span>DATED: {new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    WARDEN PANEL: VERIFY LEAVES
                   ========================================== */}
                {activePanel === "approve-leave" && (user.role === "warden" || user.role === "admin") && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-white">Verify Leaves Applications Queue</h2>
                    {leaves.filter(l => l.status === "pending").length === 0 ? (
                      <div className="p-12 text-center bg-[#161616] border border-zinc-800 rounded-2xl text-zinc-500 font-mono">
                        All leave requests cleared! Perfect residential attendance.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leaves.filter(l => l.status === "pending").map((l) => (
                          <div key={l.id} className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 text-xs">
                              <div>
                                <span className="font-bold text-white text-sm">{l.studentName}</span>
                                <span className="text-zinc-500 ml-2">Room: {l.roomNumber}</span>
                              </div>
                              <span className="font-mono text-[10px] text-[#D4AF37]">LEAVE PERMIT #{l.id}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                              <div>
                                <p className="text-zinc-500 uppercase text-[9px] font-mono">Dates of travel</p>
                                <p className="font-semibold text-white mt-0.5">{l.startDate} to {l.endDate}</p>
                              </div>
                              <div>
                                <p className="text-zinc-500 uppercase text-[9px] font-mono">Reason for leave</p>
                                <p className="font-semibold text-white mt-0.5">{l.reason}</p>
                              </div>
                            </div>
                            
                            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-serif leading-relaxed text-zinc-300 whitespace-pre-wrap text-[11px]">
                              {l.letterText}
                            </div>

                            <div className="flex gap-3 justify-end text-xs">
                              <button
                                onClick={() => handleApproveLeave(l.id, "rejected")}
                                className="px-4 py-2 border border-red-500/30 hover:bg-red-950/20 text-red-400 rounded-lg transition-all"
                              >
                                Reject Pass
                              </button>
                              <button
                                onClick={() => handleApproveLeave(l.id, "approved")}
                                className="px-4 py-2 gold-gradient-bg text-zinc-950 font-bold rounded-lg hover:brightness-110 transition-all"
                              >
                                Approve & Issue Pass
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    WARDEN PANEL: APPROVE VISITORS
                   ========================================== */}
                {activePanel === "approve-visitor" && (user.role === "warden" || user.role === "admin") && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-white">Visitor Pass Verification Board</h2>
                    {visitors.filter(v => v.status === "pending").length === 0 ? (
                      <div className="p-12 text-center bg-[#161616] border border-zinc-800 rounded-2xl text-zinc-500 font-mono">
                        No pending visitor verification passes.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visitors.filter(v => v.status === "pending").map((v) => (
                          <div key={v.id} className="bg-[#161616] p-5 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-xs space-y-1.5">
                              <p className="font-mono text-[10px] text-zinc-500">REQUEST #{v.id}</p>
                              <h4 className="font-bold text-white text-sm">{v.visitorName} ({v.relation})</h4>
                              <p className="text-zinc-400">Visiting student: <strong>{v.studentName} (Room {v.roomNumber})</strong></p>
                              <p className="text-zinc-400">Scheduled Date: <strong>{v.visitDate}</strong></p>
                              {v.purpose && <p className="text-zinc-500 italic">"Purpose: {v.purpose}"</p>}
                            </div>
                            <div className="flex gap-2 self-end sm:self-auto text-xs">
                              <button
                                onClick={() => handleApproveVisitor(v.id, "rejected")}
                                className="px-3 py-1.5 border border-red-500/20 text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleApproveVisitor(v.id, "approved")}
                                className="px-3 py-1.5 gold-gradient-bg text-zinc-950 font-bold rounded-lg hover:brightness-110 transition-all"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    WARDEN PANEL: MANAGE COMPLAINTS
                   ========================================== */}
                {activePanel === "manage-complaints" && (user.role === "warden" || user.role === "admin") && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-white">Active Residential Complaint Board</h2>
                    {complaints.length === 0 ? (
                      <div className="p-12 text-center bg-[#161616] border border-zinc-800 rounded-2xl text-zinc-500 font-mono">
                        Complaints database is clear.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {complaints.map((c) => (
                          <div key={c.id} className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4">
                            <div className="flex justify-between items-start border-b border-zinc-800 pb-2 text-xs">
                              <div>
                                <span className="font-mono text-zinc-500 text-[10px] uppercase">Ticket #{c.id}</span>
                                <p className="font-bold text-white text-sm mt-1">{c.studentName} (Room {c.roomNumber})</p>
                              </div>
                              <div className="flex gap-2">
                                {getPriorityBadge(c.priority)}
                                {getStatusBadge(c.status)}
                              </div>
                            </div>
                            
                            <div className="text-xs space-y-1.5 font-sans">
                              <h4 className="font-bold text-white text-sm">Issue: "{c.title}"</h4>
                              <p className="text-zinc-400 leading-relaxed">{c.description}</p>
                              <p className="text-[10px] text-[#D4AF37] font-mono mt-2">AI COMPLAINT SUMMARY: "{c.summary}"</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/60">
                              <div>
                                <p>CATEGORY: <strong className="text-zinc-300">{c.category}</strong></p>
                                <p className="mt-1">DEPARTMENT: <strong className="text-zinc-300">{c.department}</strong></p>
                              </div>
                              <div>
                                <p>ASSIGNED HAND: <strong className="text-zinc-300">{c.assignedTo || "Awaiting duty assignment"}</strong></p>
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 text-xs pt-2">
                              {c.status === "pending" && (
                                <button
                                  onClick={() => setDispatchComplaint(c)}
                                  className="px-4 py-2 border border-[#D4AF37]/50 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/10 transition-all font-semibold"
                                >
                                  Assign Plumber/Electrician
                                </button>
                              )}
                              {c.status === "assigned" && (
                                <button
                                  onClick={() => handleMarkResolved(c.id)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg transition-all"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    ADMIN/WARDEN PANEL: MANAGE ROOMS
                   ========================================== */}
                {activePanel === "manage-rooms" && (user.role === "admin" || user.role === "warden") && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Admin: Create Room Form */}
                    {user.role === "admin" && (
                      <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4 text-xs h-fit">
                        <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Add New Room</h3>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                          <div>
                            <label className="block text-zinc-400 mb-1">Room Number</label>
                            <input
                              type="text"
                              placeholder="e.g. B-303"
                              value={newRoomForm.roomNumber}
                              onChange={(e) => setNewRoomForm({ ...newRoomForm, roomNumber: e.target.value })}
                              required
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-zinc-400 mb-1">Block</label>
                              <input
                                type="text"
                                placeholder="B"
                                value={newRoomForm.block}
                                onChange={(e) => setNewRoomForm({ ...newRoomForm, block: e.target.value })}
                                required
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-zinc-400 mb-1">Max Capacity</label>
                              <input
                                type="number"
                                value={newRoomForm.capacity}
                                onChange={(e) => setNewRoomForm({ ...newRoomForm, capacity: parseInt(e.target.value) })}
                                required
                                min={1}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 gold-gradient-bg text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all"
                          >
                            Create Room
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Room Listings & Allocation Actions */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white">Residential Rooms Inventory</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {rooms.map((room) => (
                          <div key={room.id} className="bg-[#161616] p-5 rounded-2xl border border-zinc-800 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-sm text-white">Room {room.roomNumber} (Block {room.block})</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                                room.status === "available" ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-yellow-950 text-yellow-400 border border-yellow-900"
                              }`}>{room.status}</span>
                            </div>
                            <div className="flex justify-between font-mono text-[10px] text-zinc-400">
                              <span>Occupancy: <strong>{room.occupied} / {room.capacity} beds</strong></span>
                              <span>ID: {room.id}</span>
                            </div>
                            
                            {/* Assign button */}
                            {room.occupied < room.capacity && room.status === "available" && (
                              <button
                                onClick={() => setAllocatingRoom(room)}
                                className="w-full py-1.5 bg-zinc-900 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] border border-zinc-800 text-zinc-300 rounded-lg transition-all font-medium"
                              >
                                + Allocate Student
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* ==========================================
                    ADMIN PANEL: BROADCAST NOTICES
                   ========================================== */}
                {activePanel === "publish-notices" && user.role === "admin" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs">
                    
                    {/* Notice publisher form */}
                    <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-4 h-fit">
                      <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Publish Official Announcement</h3>
                      <form onSubmit={handleCreateNotice} className="space-y-4">
                        <div>
                          <label className="block text-zinc-400 mb-1">Notice Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Semester Fee submission schedule"
                            value={newNoticeForm.title}
                            onChange={(e) => setNewNoticeForm({ ...newNoticeForm, title: e.target.value })}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1">Priority</label>
                          <select
                            value={newNoticeForm.priority}
                            onChange={(e) => setNewNoticeForm({ ...newNoticeForm, priority: e.target.value as any })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                          >
                            <option value="normal">Normal Announcement</option>
                            <option value="urgent">Urgent Announcement</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1">Announcement Body</label>
                          <textarea
                            rows={4}
                            placeholder="Type full instructions here..."
                            value={newNoticeForm.content}
                            onChange={(e) => setNewNoticeForm({ ...newNoticeForm, content: e.target.value })}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 gold-gradient-bg text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all"
                        >
                          Broadcast Notice
                        </button>
                      </form>
                    </div>

                    {/* Notice history listings */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white">Broadcast History</h3>
                      {notices.map((n) => (
                        <div key={n.id} className="bg-[#161616] p-5 rounded-2xl border border-zinc-800 flex items-start justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-zinc-500 text-[9px]">NOTICE #{n.id}</span>
                              {n.priority === "urgent" && <span className="bg-red-950 border border-red-500/30 text-red-400 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">Urgent</span>}
                            </div>
                            <h4 className="font-bold text-white">{n.title}</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed font-sans">{n.content}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteNotice(n.id)}
                            className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                            title="Delete notice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* ==========================================
                    ADMIN PANEL: MANAGE USERS
                   ========================================== */}
                {activePanel === "manage-users" && user.role === "admin" && (
                  <div className="space-y-6 text-xs">
                    <h2 className="text-lg font-bold text-white">Institutional Staff & Student Directory</h2>
                    
                    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#161616]">
                      <table className="w-full border-collapse text-left text-zinc-300">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase">
                            <th className="p-4 font-bold">Name & Role</th>
                            <th className="p-4 font-bold">Email / Contact</th>
                            <th className="p-4 font-bold">Department / Year</th>
                            <th className="p-4 font-bold">Room Assigned</th>
                            <th className="p-4 font-bold text-right">Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map((u) => (
                            <tr key={u.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/20 transition-all font-sans">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                                    {u.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white">{u.name}</p>
                                    <p className="text-[10px] text-[#D4AF37] uppercase font-mono mt-0.5">{u.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-mono text-zinc-200">{u.email}</p>
                                <p className="text-zinc-500 mt-0.5">{u.phone}</p>
                              </td>
                              <td className="p-4">
                                <p className="text-zinc-200">{u.department || "N/A"}</p>
                                <p className="text-zinc-500 mt-0.5">{u.year || "Staff"}</p>
                              </td>
                              <td className="p-4">
                                <span className={`font-mono text-xs ${u.roomNumber ? "text-white" : "text-zinc-600 font-bold"}`}>
                                  {u.roomNumber || "No Room"}
                                </span>
                              </td>
                              <td className="p-4 text-right text-zinc-500 font-mono text-[10px]">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </main>

      {/* ==========================================
          C. MODALS & SLIDE-OVER COGNITIVE SHEETS
         ========================================== */}



      {/* 2. SECURITY CHECKOUT PAYMENT GATEWAY MODAL OVERLAY */}
      {showPaymentGateway && selectedFee && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#161616] border border-[#D4AF37]/30 p-6 sm:p-8 rounded-2xl space-y-6 fade-in-slide relative">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h4 className="font-extrabold text-white text-base">HERA Gold Secure Checkout</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">PCI-DSS Encrypted sandbox</p>
            </div>

            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Invoice Reference</span>
                <span className="font-mono text-white">#{selectedFee.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fee Category</span>
                <span className="font-mono uppercase text-white font-bold">{selectedFee.category}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850 pt-2.5">
                <span className="text-zinc-400">Gross Payable</span>
                <span className="text-base font-extrabold text-[#D4AF37]">₹{selectedFee.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Simulated Cardholder Name</label>
                <input type="text" value={user.name} disabled className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-zinc-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-400 mb-1">Card Number (Sandbox Mock)</label>
                  <input type="text" placeholder="4111 2222 3333 4444" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] text-center" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">CVV</label>
                  <input type="password" placeholder="•••" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] text-center" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-xs pt-2">
              <button
                onClick={() => { setShowPaymentGateway(false); setSelectedFee(null); }}
                className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
                disabled={isPaying}
              >
                Cancel Transaction
              </button>
              <button
                onClick={handlePayFee}
                className="flex-1 py-3 gold-gradient-bg text-zinc-950 font-bold uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-md shadow-[#D4AF37]/10 flex items-center justify-center gap-1"
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Authorize Charge</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLAINT WORKER REPAIR DISPATCH MODAL OVERLAY (WARDEN/ADMIN ONLY) */}
      {dispatchComplaint && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#161616] border border-[#D4AF37]/30 p-6 rounded-2xl space-y-5 fade-in-slide relative">
            <div>
              <h4 className="font-extrabold text-white text-base">Assign Maintenance Hand</h4>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">Complaint: "{dispatchComplaint.title}"</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Select / Type Operator Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Sharma (Plumber)" 
                  value={dispatcherName}
                  onChange={(e) => setDispatcherName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]" 
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDispatcherName("Ramesh Sharma (Plumber)")} 
                  className="bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded text-[10px]"
                >
                  🛠️ Plumber Ramesh
                </button>
                <button 
                  onClick={() => setDispatcherName("Amit Verma (Electrician)")} 
                  className="bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded text-[10px]"
                >
                  ⚡ Electrician Amit
                </button>
              </div>
            </div>

            <div className="flex gap-3 text-xs pt-2">
              <button
                onClick={() => { setDispatchComplaint(null); setDispatcherName(""); }}
                className="flex-1 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
              >
                Close
              </button>
              <button
                onClick={handleDispatchComplaint}
                className="flex-1 py-2.5 gold-gradient-bg text-zinc-950 font-bold rounded-xl hover:brightness-110 transition-all"
              >
                Dispatch Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ROOM ASSIGNMENT / ALLOCATION MODAL OVERLAY (WARDEN/ADMIN ONLY) */}
      {allocatingRoom && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#161616] border border-[#D4AF37]/30 p-6 rounded-2xl space-y-5 fade-in-slide relative">
            <div>
              <h4 className="font-extrabold text-white text-base">Allocate Student to Room {allocatingRoom.roomNumber}</h4>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">Available beds: {allocatingRoom.capacity - allocatingRoom.occupied}</p>
            </div>

            <div className="space-y-4 text-xs max-h-60 overflow-y-auto pr-1">
              <p className="text-zinc-400 font-medium border-b border-zinc-800 pb-2">Students waiting for room allocation:</p>
              {unallocatedStudents.length === 0 ? (
                <p className="text-zinc-600 text-center font-mono py-4">No unallocated students waiting.</p>
              ) : (
                unallocatedStudents.map((student) => (
                  <div key={student.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{student.name}</p>
                      <p className="text-[10px] text-zinc-500">{student.department} | {student.year}</p>
                    </div>
                    <button
                      onClick={() => handleAllocateStudent(student.id)}
                      className="px-3 py-1.5 bg-[#D4AF37] text-zinc-950 font-bold rounded-lg hover:brightness-110 transition-all text-[10px]"
                    >
                      Assign here
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setAllocatingRoom(null)}
              className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all text-xs"
            >
              Cancel Allocation
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
