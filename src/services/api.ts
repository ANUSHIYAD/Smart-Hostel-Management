import { User, Room, Complaint, Leave, Visitor, Fee, Notice, Notification, AIChat, MessMenu, MessFeedback, AnalyticsData } from "../types";

const getHeaders = () => {
  const token = localStorage.getItem("hostel_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Generic fetch handler with error propagation
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth API
  auth: {
    login: async (body: { email: string; passwordHash?: string; password?: string; rememberMe?: boolean }) => {
      // support both password and passwordHash from UI form
      const data = {
        email: body.email,
        password: body.password || body.passwordHash || "",
        rememberMe: body.rememberMe,
      };
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    register: async (body: any) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    forgotPassword: async (email: string) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      return handleResponse(res);
    },
    resetPassword: async (body: any) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch("/api/auth/me", {
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // Rooms API
  rooms: {
    getAll: async (): Promise<Room[]> => {
      const res = await fetch("/api/room", { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (body: { roomNumber: string; block: string; capacity: number }): Promise<Room> => {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    update: async (id: string, body: { status?: string; capacity?: number }): Promise<Room> => {
      const res = await fetch(`/api/room/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`/api/room/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    allocate: async (roomId: string, studentId: string): Promise<Room> => {
      const res = await fetch(`/api/room/${roomId}/allocate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ studentId }),
      });
      return handleResponse(res);
    }
  },

  // Complaints API
  complaints: {
    getAll: async (): Promise<Complaint[]> => {
      const res = await fetch("/api/complaints", { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (body: { title: string; description: string }): Promise<{ message: string; complaint: Complaint }> => {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, body: { status: string; assignedTo?: string; remarks?: string }): Promise<Complaint> => {
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    }
  },

  // Leave Management API
  leave: {
    getAll: async (): Promise<Leave[]> => {
      const res = await fetch("/api/leave", { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (body: { startDate: string; endDate: string; reason: string; letterText?: string }): Promise<{ message: string; leave: Leave }> => {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, body: { status: "approved" | "rejected"; remarks?: string }): Promise<Leave> => {
      const res = await fetch(`/api/leave/${id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    }
  },

  // Visitors API
  visitors: {
    getAll: async (): Promise<Visitor[]> => {
      const res = await fetch("/api/visitor", { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (body: { visitorName: string; relation: string; visitDate: string; purpose: string }): Promise<Visitor> => {
      const res = await fetch("/api/visitor", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, status: "approved" | "rejected"): Promise<Visitor> => {
      const res = await fetch(`/api/visitor/${id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    }
  },

  // Mess API
  mess: {
    getDetails: async (): Promise<{ menu: MessMenu; feedback: MessFeedback[] }> => {
      const res = await fetch("/api/student/mess", { headers: getHeaders() });
      return handleResponse(res);
    },
    submitFeedback: async (body: { rating: number; comment: string }): Promise<{ message: string; feedback: MessFeedback }> => {
      const res = await fetch("/api/student/mess/feedback", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    }
  },

  // Fees API
  fees: {
    getAll: async (): Promise<Fee[]> => {
      const res = await fetch("/api/fees", { headers: getHeaders() });
      return handleResponse(res);
    },
    pay: async (id: string): Promise<{ message: string; fee: Fee }> => {
      const res = await fetch(`/api/fees/${id}/pay`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // Notices API
  notices: {
    getAll: async (): Promise<Notice[]> => {
      const res = await fetch("/api/notices", { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (body: { title: string; content: string; priority?: "normal" | "urgent" }): Promise<Notice> => {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`/api/notices/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // Notifications API
  notifications: {
    getAll: async (): Promise<Notification[]> => {
      const res = await fetch("/api/notification", { headers: getHeaders() });
      return handleResponse(res);
    },
    markRead: async (id: string): Promise<{ success: boolean }> => {
      const res = await fetch(`/api/notification/${id}/read`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // AI Chat API
  chat: {
    getHistory: async (): Promise<AIChat> => {
      const res = await fetch("/api/chat", { headers: getHeaders() });
      return handleResponse(res);
    },
    sendMessage: async (message: string): Promise<{ chat: AIChat; aiFeedback: any }> => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ message }),
      });
      return handleResponse(res);
    },
    clearHistory: async (): Promise<{ success: boolean; message: string }> => {
      const res = await fetch("/api/chat", {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  },

  // Admin Reports / Analytics API
  reports: {
    getAnalytics: async (): Promise<AnalyticsData> => {
      const res = await fetch("/api/reports/analytics", { headers: getHeaders() });
      return handleResponse(res);
    },
    getAllUsers: async (): Promise<User[]> => {
      const res = await fetch("/api/users", { headers: getHeaders() });
      return handleResponse(res);
    },
    deleteUser: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    }
  }
};
