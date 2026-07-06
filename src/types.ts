export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "warden" | "admin";
  department?: string;
  year?: string;
  gender?: string;
  roomNumber?: string;
  profilePicture?: string;
  isVerified: boolean;
  otpCode?: string;
  createdAt?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  block: string;
  capacity: number;
  occupied: number;
  status: "available" | "maintenance" | "full";
  students: string[];
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "assigned" | "resolved";
  department: string;
  summary: string;
  assignedTo?: string;
  createdAt: string;
  remarks?: string;
}

export interface Leave {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  startDate: string;
  endDate: string;
  reason: string;
  letterText: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  createdAt: string;
  remarks?: string;
}

export interface Visitor {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  visitorName: string;
  relation: string;
  visitDate: string;
  purpose: string;
  qrCode: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  createdAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  category: "hostel" | "mess" | "caution";
  paidAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "alert" | "success" | "warning";
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface AIChat {
  id: string;
  userId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface MenuItem {
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

export interface MessMenu {
  Monday: MenuItem;
  Tuesday: MenuItem;
  Wednesday: MenuItem;
  Thursday: MenuItem;
  Friday: MenuItem;
  Saturday: MenuItem;
  Sunday: MenuItem;
}

export interface MessFeedback {
  id: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  priority: "normal" | "urgent";
}

export interface AnalyticsData {
  counts: {
    totalStudents: number;
    totalWardens: number;
    totalRooms: number;
    occupiedRooms: number;
    totalCapacity: number;
    totalOccupancy: number;
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    assignedComplaints: number;
    totalLeaves: number;
    pendingLeaves: number;
    approvedLeaves: number;
    avgMessRating: string;
  };
  aiInsights: {
    messRecommendation: string;
    maintenancePrediction: string;
  };
  charts: {
    complaintsByCategory: {
      Plumbing: number;
      Electrical: number;
      IT: number;
      Security: number;
      Others: number;
    };
    roomOccupancyByBlock: {
      A: number;
      B: number;
    };
  };
}
