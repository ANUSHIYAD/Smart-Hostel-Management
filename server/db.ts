import fs from "fs";
import path from "path";

// Define Data Schemas
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
  passwordHash: string;
  isVerified: boolean;
  otpCode?: string;
  rememberMe?: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  block: string;
  capacity: number;
  occupied: number;
  status: "available" | "maintenance" | "full";
  students: string[]; // User IDs
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
  qrCode: string; // Base64 or SVG
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
  userId: string; // "all" or specific user id
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

export interface MessFeedback {
  id: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
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

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  priority: "normal" | "urgent";
}

export interface DatabaseSchema {
  users: User[];
  rooms: Room[];
  complaints: Complaint[];
  leaves: Leave[];
  visitors: Visitor[];
  fees: Fee[];
  notifications: Notification[];
  chats: AIChat[];
  messMenu: MessMenu;
  messFeedback: MessFeedback[];
  notices: Notice[];
}

const DB_FILE = path.join(process.cwd(), "database.json");

// Default initial state of the database with seeded content
const initialDatabase: DatabaseSchema = {
  users: [
    {
      id: "usr-admin",
      name: "Dr. Rajesh Kumar",
      email: "admin@hostel.com",
      phone: "+91 98765 43210",
      role: "admin",
      passwordHash: "admin", // Simple password check for demo purposes
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-warden",
      name: "Mr. Suresh Sharma",
      email: "warden@hostel.com",
      phone: "+91 87654 32109",
      role: "warden",
      department: "Warden Office",
      year: "Staff",
      createdAt: new Date().toISOString(),
      passwordHash: "warden",
      isVerified: true,
    },
    {
      id: "usr-student-1",
      name: "Ananya Roy",
      email: "student@hostel.com",
      phone: "+91 76543 21098",
      role: "student",
      department: "Computer Science & Engineering",
      year: "Final Year",
      gender: "Female",
      roomNumber: "B-302",
      createdAt: new Date().toISOString(),
      passwordHash: "student",
      isVerified: true,
    },
  ],
  rooms: [
    {
      id: "rm-101",
      roomNumber: "A-101",
      block: "A",
      capacity: 2,
      occupied: 0,
      status: "available",
      students: [],
    },
    {
      id: "rm-102",
      roomNumber: "A-102",
      block: "A",
      capacity: 2,
      occupied: 0,
      status: "maintenance",
      students: [],
    },
    {
      id: "rm-302",
      roomNumber: "B-302",
      block: "B",
      capacity: 3,
      occupied: 1,
      status: "available",
      students: ["usr-student-1"],
    },
    {
      id: "rm-303",
      roomNumber: "B-303",
      block: "B",
      capacity: 3,
      occupied: 0,
      status: "available",
      students: [],
    },
  ],
  complaints: [
    {
      id: "comp-1",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      roomNumber: "B-302",
      title: "Water dripping from bathroom pipe",
      description: "There is an active leak in the ceiling piping of room B-302's bathroom. It drips continuously and has pooled water on the floor, posing a slip risk.",
      category: "Plumbing",
      priority: "high",
      status: "assigned",
      department: "Maintenance - Plumbing",
      summary: "Bathroom leak causing wet floor; assigned to plumber Ramesh. Priority high due to slip risk.",
      assignedTo: "Ramesh Sharma (Plumber)",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    },
    {
      id: "comp-2",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      roomNumber: "B-302",
      title: "Slow internet speeds & dropouts",
      description: "The wifi router closest to room B-302 frequently drops connection. When active, download speeds are under 1Mbps.",
      category: "IT & Network",
      priority: "medium",
      status: "pending",
      department: "Infrastructure - IT",
      summary: "Unstable Wi-Fi in block B, corridor 3rd floor. Connection drops repeatedly.",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    },
  ],
  leaves: [
    {
      id: "lv-1",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      roomNumber: "B-302",
      startDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0], // tomorrow
      endDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0], // in 3 days
      reason: "Attending sister's wedding ceremony in Kolkata.",
      letterText: "Respected Warden,\n\nI am writing to formally request leave from the hostel starting tomorrow for a period of three days. I need to travel home to Kolkata to attend my sister's wedding ceremony, which is a major family event requiring my presence.\n\nI will make sure to catch up on any missed academic classes and return to the hostel promptly. I request you to kindly approve my leave and issue a gate pass.\n\nYours sincerely,\nAnanya Roy\nCSE Department",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ],
  visitors: [
    {
      id: "vis-1",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      roomNumber: "B-302",
      visitorName: "Sunita Roy",
      relation: "Mother",
      visitDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split("T")[0], // in 2 days
      purpose: "Bringing home-cooked food and checking in on academic health.",
      qrCode: "VIS-PASS-SUNITA-ROY-B302",
      status: "approved",
      approvedBy: "Mr. Suresh Sharma",
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
  ],
  fees: [
    {
      id: "fee-1",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      roomNumber: "B-302",
      amount: 45000,
      dueDate: "2026-07-25",
      status: "pending",
      category: "hostel",
    },
    {
      id: "fee-2",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      roomNumber: "B-302",
      amount: 15000,
      dueDate: "2026-07-15",
      status: "pending",
      category: "mess",
    },
    {
      id: "fee-3",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      roomNumber: "B-302",
      amount: 5000,
      dueDate: "2026-01-10",
      status: "paid",
      category: "caution",
      paidAt: "2026-01-08T10:00:00.000Z",
    },
  ],
  notifications: [
    {
      id: "notif-1",
      userId: "all",
      title: "Annual Sports Day Registrations",
      message: "Registrations for the Annual Hostel Sports Tournament are now open. Register at the warden office before July 10.",
      type: "info",
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: "notif-2",
      userId: "usr-student-1",
      title: "Visitor Pass Approved",
      message: "Your visitor pass request for Mrs. Sunita Roy (Mother) has been APPROVED by Warden Suresh Sharma.",
      type: "success",
      isRead: false,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    {
      id: "notif-3",
      userId: "usr-student-1",
      title: "Hostel Fee Pending",
      message: "Friendly reminder: Your Hostel Admission Fee of ₹45,000 is due on July 25, 2026.",
      type: "warning",
      isRead: false,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  ],
  chats: [],
  messMenu: {
    Monday: {
      breakfast: "Idli, Vada, Sambhar, Chutney, Tea & Coffee",
      lunch: "Rice, Dal Fry, Kadai Paneer, Chapati, Curd, Salad",
      snacks: "Samosa, Mint Chutney, Tea",
      dinner: "Jeera Rice, Butter Roti, Mixed Veg, Dal Tadka, Kheer",
    },
    Tuesday: {
      breakfast: "Aloo Paratha, Butter, Pickle, Curd, Tea & Coffee",
      lunch: "Veg Biryani, Raita, Chole Masala, Bhature, Salad",
      snacks: "Poha, Sev, Tea",
      dinner: "Rice, Chapati, Paneer Bhurji, Dal Mong, Gulab Jamun",
    },
    Wednesday: {
      breakfast: "Puri Bhaji, Halwa, Sprouts, Tea & Coffee",
      lunch: "Jeera Rice, Roti, Rajma Masala, Aloo Gobi, Curd",
      snacks: "Veg Cutlet, Tomato Sauce, Tea",
      dinner: "Rice, Chapati, Chicken Curry / Shahi Paneer, Dal, Ice Cream",
    },
    Thursday: {
      breakfast: "Bread Butter Jam, Veg Cutlet, Boiled Eggs / Fruits, Tea",
      lunch: "Rice, Chapati, Veg Kofta, Dal Makhani, Curd, Salad",
      snacks: "Aloo Bonda, Green Chutney, Tea",
      dinner: "Kashmiri Pulao, Butter Roti, Palak Paneer, Dal Fry, Custard",
    },
    Friday: {
      breakfast: "Uttapam, Coconut Chutney, Sambhar, Tea & Coffee",
      lunch: "Rice, Butter Roti, Veg Jalfrezi, Yellow Dal, Fruit Raita",
      snacks: "Bread Pakora, Tea",
      dinner: "Egg Curry / Kadai Mushroom, Rice, Chapati, Dal, Jalebi",
    },
    Saturday: {
      breakfast: "Masala Dosa, Sambhar, Tomato Chutney, Tea & Coffee",
      lunch: "Rice, Roti, Soyabean Masala, Dal Tadka, Papad, Salad",
      snacks: "Dhokla, Tea",
      dinner: "Veg Fried Rice, Manchurian, Spring Rolls, Ice Cream",
    },
    Sunday: {
      breakfast: "Chola Bhatura, Pickle, Sweet Lassi, Fruits",
      lunch: "Special Veg Thali: Shahi Paneer, Dal Makhani, Pulao, Butter Naan",
      snacks: "Kachori, Tea",
      dinner: "Special Chicken Biryani / Paneer Biryani, Mirchi Ka Salan, Raita",
    },
  },
  messFeedback: [
    {
      id: "fb-1",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      rating: 5,
      comment: "The Sunday Special Veg Thali and Biryani was absolutely stellar!",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "fb-2",
      studentId: "usr-student-1",
      studentName: "Ananya Roy",
      rating: 4,
      comment: "The Wednesday Paneer was really good, but please reduce the oil content slightly.",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
  ],
  notices: [
    {
      id: "nt-1",
      title: "Hostel Fee Payment Deadline Approaching",
      content: "All students are requested to clear their Semester Hostel and Mess Fees on or before July 25, 2026. Late fees will apply after the deadline. Please pay online via the student portal or submit a draft at the accounts section.",
      createdBy: "Dr. Rajesh Kumar (Chief Admin)",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      priority: "urgent",
    },
    {
      id: "nt-2",
      title: "Maintenance Work: B-Block Water Pipe Line Upgrade",
      content: "Please note that water supply in B-Block will be partially affected on Sunday, July 5, between 10 AM and 2 PM due to main pipeline upgrading works. Please store water in advance. We regret the temporary inconvenience.",
      createdBy: "Mr. Suresh Sharma (Warden)",
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      priority: "normal",
    },
  ],
};

// Database class to read and write
class DBManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("Failed to read database.json, re-initializing", e);
    }
    this.save(initialDatabase);
    return initialDatabase;
  }

  public save(newData?: DatabaseSchema): void {
    if (newData) {
      this.data = newData;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to database.json", e);
    }
  }

  // Generic Getters
  public getUsers() { return this.data.users; }
  public getRooms() { return this.data.rooms; }
  public getComplaints() { return this.data.complaints; }
  public getLeaves() { return this.data.leaves; }
  public getVisitors() { return this.data.visitors; }
  public getFees() { return this.data.fees; }
  public getNotifications() { return this.data.notifications; }
  public getChats() { return this.data.chats; }
  public getMessMenu() { return this.data.messMenu; }
  public getMessFeedback() { return this.data.messFeedback; }
  public getNotices() { return this.data.notices; }

  // Custom DB modifiers
  public saveUser(user: User): void {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.save();
  }

  public saveRoom(room: Room): void {
    const idx = this.data.rooms.findIndex((r) => r.id === room.id);
    if (idx >= 0) {
      this.data.rooms[idx] = room;
    } else {
      this.data.rooms.push(room);
    }
    this.save();
  }

  public deleteRoom(roomId: string): void {
    this.data.rooms = this.data.rooms.filter((r) => r.id !== roomId);
    this.save();
  }

  public saveComplaint(complaint: Complaint): void {
    const idx = this.data.complaints.findIndex((c) => c.id === complaint.id);
    if (idx >= 0) {
      this.data.complaints[idx] = complaint;
    } else {
      this.data.complaints.push(complaint);
    }
    this.save();
  }

  public saveLeave(leave: Leave): void {
    const idx = this.data.leaves.findIndex((l) => l.id === leave.id);
    if (idx >= 0) {
      this.data.leaves[idx] = leave;
    } else {
      this.data.leaves.push(leave);
    }
    this.save();
  }

  public saveVisitor(visitor: Visitor): void {
    const idx = this.data.visitors.findIndex((v) => v.id === visitor.id);
    if (idx >= 0) {
      this.data.visitors[idx] = visitor;
    } else {
      this.data.visitors.push(visitor);
    }
    this.save();
  }

  public saveFee(fee: Fee): void {
    const idx = this.data.fees.findIndex((f) => f.id === fee.id);
    if (idx >= 0) {
      this.data.fees[idx] = fee;
    } else {
      this.data.fees.push(fee);
    }
    this.save();
  }

  public addNotification(notification: Notification): void {
    this.data.notifications.unshift(notification);
    this.save();
  }

  public markNotificationAsRead(notifId: string, userId: string): void {
    const notifs = this.data.notifications;
    for (const notif of notifs) {
      if (notif.id === notifId && (notif.userId === userId || notif.userId === "all")) {
        notif.isRead = true;
      }
    }
    this.save();
  }

  public saveChat(chat: AIChat): void {
    const idx = this.data.chats.findIndex((c) => c.id === chat.id);
    if (idx >= 0) {
      this.data.chats[idx] = chat;
    } else {
      this.data.chats.push(chat);
    }
    this.save();
  }

  public addMessFeedback(feedback: MessFeedback): void {
    this.data.messFeedback.unshift(feedback);
    this.save();
  }

  public saveNotice(notice: Notice): void {
    const idx = this.data.notices.findIndex((n) => n.id === notice.id);
    if (idx >= 0) {
      this.data.notices[idx] = notice;
    } else {
      this.data.notices.push(notice);
    }
    this.save();
  }

  public deleteNotice(noticeId: string): void {
    this.data.notices = this.data.notices.filter((n) => n.id !== noticeId);
    this.save();
  }

  public deleteUser(userId: string): void {
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    this.save();
  }
}

export const db = new DBManager();
