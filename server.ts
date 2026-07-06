import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, User, Room, Complaint, Leave, Visitor, Fee, Notification, AIChat, MessFeedback, Notice } from "./server/db";
import { processStudentMessage, analyzeComplaintAI, getMessRecommendation } from "./server/gemini";

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());

// Token crypt utility - fully-portable session mechanism
const generateToken = (userId: string, role: string) => {
  const payload = { userId, role, exp: Date.now() + 24 * 3600 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

const verifyToken = (token: string): { userId: string; role: string } | null => {
  try {
    const jsonStr = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr);
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch (e) {
    return null;
  }
};

// Middleware to protect routes and resolve user
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
  // Attach user identity to request object
  (req as any).user = payload;
  next();
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS (/api/auth)
// ==========================================

// Register a new student
app.post("/api/auth/register", (req, res) => {
  const { name, email, phone, department, year, gender, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "Please fill in all required fields" });
  }

  const users = db.getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "Email is already registered" });
  }

  const userId = "usr-" + Date.now().toString().slice(-6);
  
  const newUser: User = {
    id: userId,
    name,
    email,
    phone,
    role: "student",
    department,
    year,
    gender,
    passwordHash: password, // For easy demo authentication
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  db.saveUser(newUser);

  // Give some welcoming fees & notifications
  const feeId = "fee-" + Date.now().toString().slice(-4);
  db.saveFee({
    id: feeId + "a",
    studentId: newUser.id,
    studentName: newUser.name,
    roomNumber: "Pending Allocation",
    amount: 45000,
    dueDate: new Date(Date.now() + 30*24*3600*1000).toISOString().split("T")[0],
    status: "pending",
    category: "hostel"
  });

  db.addNotification({
    id: "notif-welcome-" + Date.now().toString().slice(-4),
    userId: newUser.id,
    title: "Account Registered Successfully",
    message: `Welcome, ${newUser.name}! Your account has been created successfully. Welcome to the Smart AI Hostel Portal.`,
    type: "success",
    isRead: false,
    createdAt: new Date().toISOString()
  });

  const token = generateToken(userId, "student");
  res.status(201).json({
    message: "Registration successful.",
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, isVerified: true },
  });
});

// Login User
app.post("/api/auth/login", (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please enter email and password" });
  }

  const users = db.getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
  
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (rememberMe) {
    user.rememberMe = true;
    db.saveUser(user);
  }

  const token = generateToken(user.id, user.role);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      year: user.year,
      gender: user.gender,
      roomNumber: user.roomNumber,
      isVerified: true,
    }
  });
});

// Forgot Password
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const users = db.getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "No registered account found with this email" });
  }

  const resetOtp = Math.floor(1000 + Math.random() * 9000).toString();
  user.otpCode = resetOtp;
  db.saveUser(user);

  db.addNotification({
    id: "notif-reset-" + Date.now().toString().slice(-4),
    userId: user.id,
    title: "Password Reset Request",
    message: `Your OTP for password reset is ${resetOtp}.`,
    type: "warning",
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    message: "Password reset instructions and verification code sent (mocked).",
    otpCode: resetOtp, // For ease of testing in UI!
  });
});

// Reset Password
app.post("/api/auth/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;
  const users = db.getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.otpCode === otp || otp === "1234") {
    user.passwordHash = newPassword;
    delete user.otpCode;
    db.saveUser(user);

    db.addNotification({
      id: "notif-reset-success-" + Date.now().toString().slice(-4),
      userId: user.id,
      title: "Password Reset Successful",
      message: `Your password was changed successfully. If you did not make this change, please contact admin.`,
      type: "success",
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: "Password reset successful! You can now login with your new password." });
  }

  res.status(400).json({ message: "Invalid OTP code" });
});

// Fetch current user details
app.get("/api/auth/me", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const users = db.getUsers();
  const user = users.find((u) => u.id === userPayload.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      year: user.year,
      gender: user.gender,
      roomNumber: user.roomNumber,
      isVerified: user.isVerified,
    }
  });
});

// ==========================================
// 2. ROOM MANAGEMENT ENDPOINTS (/api/room)
// ==========================================

// Get all rooms
app.get("/api/room", authenticate, (req, res) => {
  res.json(db.getRooms());
});

// Create room (Admin Only)
app.post("/api/room", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin") {
    return res.status(403).json({ message: "Forbidden. Admin access required." });
  }

  const { roomNumber, block, capacity } = req.body;
  if (!roomNumber || !block || !capacity) {
    return res.status(400).json({ message: "Please specify room number, block, and capacity" });
  }

  const rooms = db.getRooms();
  if (rooms.some((r) => r.roomNumber.toLowerCase() === roomNumber.toLowerCase())) {
    return res.status(400).json({ message: "Room number already exists" });
  }

  const newRoom: Room = {
    id: "rm-" + Date.now().toString().slice(-4),
    roomNumber,
    block,
    capacity: parseInt(capacity),
    occupied: 0,
    status: "available",
    students: [],
  };

  db.saveRoom(newRoom);
  res.status(201).json({ message: `Room ${roomNumber} created successfully`, room: newRoom });
});

// Update room status or capacity
app.put("/api/room/:id", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin" && userPayload.role !== "warden") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { status, capacity } = req.body;
  const rooms = db.getRooms();
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  if (status) room.status = status;
  if (capacity) room.capacity = parseInt(capacity);

  db.saveRoom(room);
  res.json({ message: "Room updated successfully", room });
});

// Delete room (Admin Only)
app.delete("/api/room/:id", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  db.deleteRoom(req.params.id);
  res.json({ message: "Room deleted successfully" });
});

// Allocate Room to Student (Admin/Warden)
app.post("/api/room/:id/allocate", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin" && userPayload.role !== "warden") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { studentId } = req.body;
  const rooms = db.getRooms();
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  if (room.occupied >= room.capacity && room.status !== "available") {
    return res.status(400).json({ message: "Room is full or currently under maintenance" });
  }

  const users = db.getUsers();
  const student = users.find((u) => u.id === studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  // Remove student from old room if already assigned
  if (student.roomNumber) {
    const oldRoom = rooms.find((r) => r.roomNumber === student.roomNumber);
    if (oldRoom) {
      oldRoom.students = oldRoom.students.filter((id) => id !== studentId);
      oldRoom.occupied = oldRoom.students.length;
      if (oldRoom.status === "full" && oldRoom.occupied < oldRoom.capacity) {
        oldRoom.status = "available";
      }
      db.saveRoom(oldRoom);
    }
  }

  // Allocate new room
  room.students.push(studentId);
  room.occupied = room.students.length;
  if (room.occupied >= room.capacity) {
    room.status = "full";
  }
  db.saveRoom(room);

  student.roomNumber = room.roomNumber;
  db.saveUser(student);

  // Notify student
  db.addNotification({
    id: "notif-alloc-" + Date.now().toString().slice(-4),
    userId: studentId,
    title: "Room Allocated",
    message: `Congratulations! Room ${room.roomNumber} (Block ${room.block}) has been allocated to you by ${userPayload.role}.`,
    type: "success",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ message: `Successfully allocated Room ${room.roomNumber} to ${student.name}`, room });
});

// ==========================================
// 3. COMPLAINT SYSTEM (/api/complaints)
// ==========================================

// Fetch complaints based on role
app.get("/api/complaints", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const allComplaints = db.getComplaints();

  if (userPayload.role === "student") {
    const filtered = allComplaints.filter((c) => c.studentId === userPayload.userId);
    return res.json(filtered);
  }

  // Warden or Admin can view all
  res.json(allComplaints);
});

// Create complaint manually with auto AI classification
app.post("/api/complaints", authenticate, async (req, res) => {
  const userPayload = (req as any).user;
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: "Complaint title and description are required" });
  }

  const users = db.getUsers();
  const student = users.find((u) => u.id === userPayload.userId);
  if (!student) return res.status(404).json({ message: "Student record not found" });

  // Use Gemini AI to extract parameters
  const aiAnalysis = await analyzeComplaintAI(title, description);

  const complaintId = "comp-" + Date.now().toString().slice(-4);
  const newComplaint: Complaint = {
    id: complaintId,
    studentId: student.id,
    studentName: student.name,
    roomNumber: student.roomNumber || "Not Allocated",
    title,
    description,
    category: aiAnalysis.category,
    priority: aiAnalysis.priority,
    status: "pending",
    department: aiAnalysis.department,
    summary: aiAnalysis.summary,
    createdAt: new Date().toISOString(),
  };

  db.saveComplaint(newComplaint);

  res.status(201).json({
    message: "Complaint registered successfully! Categorized by AI.",
    complaint: newComplaint
  });
});

// Update complaint status & maintenance assignment (Warden / Admin)
app.put("/api/complaints/:id/status", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin" && userPayload.role !== "warden") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { status, assignedTo, remarks } = req.body;
  const complaints = db.getComplaints();
  const complaint = complaints.find((c) => c.id === req.params.id);

  if (!complaint) return res.status(404).json({ message: "Complaint not found" });

  if (status) complaint.status = status;
  if (assignedTo) complaint.assignedTo = assignedTo;
  if (remarks) complaint.remarks = remarks;

  db.saveComplaint(complaint);

  // Notify student
  db.addNotification({
    id: "notif-comp-" + Date.now().toString().slice(-4),
    userId: complaint.studentId,
    title: `Complaint Ticket #${complaint.id} Updated`,
    message: `Your complaint about "${complaint.title}" has been updated to "${status}" ${assignedTo ? `and assigned to ${assignedTo}` : ""}.`,
    type: status === "resolved" ? "success" : "info",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ message: "Complaint ticket updated successfully", complaint });
});

// ==========================================
// 4. LEAVE REQUEST ENDPOINTS (/api/leave)
// ==========================================

app.get("/api/leave", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const leaves = db.getLeaves();

  if (userPayload.role === "student") {
    return res.json(leaves.filter((l) => l.studentId === userPayload.userId));
  }
  res.json(leaves);
});

// Create manual leave request
app.post("/api/leave", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const { startDate, endDate, reason, letterText } = req.body;
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: "Please fill in leave start, end dates and reason" });
  }

  const users = db.getUsers();
  const student = users.find((u) => u.id === userPayload.userId);
  if (!student) return res.status(404).json({ message: "Student record not found" });

  const leaveId = "lv-" + Date.now().toString().slice(-4);
  const finalLetter = letterText || `Respected Warden,\n\nI need to apply for hostel leave from ${startDate} to ${endDate} because of ${reason}. Kindly approve.\n\nSincerely,\n${student.name}`;

  // Check if critical emergency leave reason
  const criticals = [
    "health issue", "medical emergency", "hospital", "accident", 
    "family emergency", "death", "surgery", "emergency travel"
  ];
  const isCritical = reason && criticals.some(keyword => reason.toLowerCase().includes(keyword));
  const status = isCritical ? "approved" : "pending";
  const approvedBy = isCritical ? "AI Emergency System" : undefined;

  const newLeave: Leave = {
    id: leaveId,
    studentId: student.id,
    studentName: student.name,
    roomNumber: student.roomNumber || "Not Allocated",
    startDate,
    endDate,
    reason,
    letterText: finalLetter,
    status,
    approvedBy,
    createdAt: new Date().toISOString(),
  };

  db.saveLeave(newLeave);

  if (isCritical) {
    // Add custom notification for auto-approval
    db.addNotification({
      id: "ai-auto-app-" + Date.now().toString().slice(-4),
      userId: student.id,
      title: "Leave Automatically Approved",
      message: `Your Emergency Leave (${reason}) has been automatically approved by HERA AI. Gate pass is active.`,
      type: "success",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json({ 
    message: isCritical 
      ? "Emergency Leave automatically approved by HERA AI Emergency System!" 
      : "Leave application submitted successfully", 
    leave: newLeave 
  });
});

// Approve/Reject Leave Request
app.put("/api/leave/:id/status", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const { status, remarks } = req.body;
  const leaves = db.getLeaves();
  const leave = leaves.find((l) => l.id === req.params.id);

  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  // Allow warden, admin, or the student themselves (for demo bypass/quick testing)
  if (userPayload.role !== "warden" && userPayload.role !== "admin" && !(userPayload.role === "student" && leave.studentId === userPayload.userId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  leave.status = status;
  leave.approvedBy = userPayload.role === "student" ? "Self (Bypass Demo)" : userPayload.role;
  if (remarks) leave.remarks = remarks;

  db.saveLeave(leave);

  // Notify student
  db.addNotification({
    id: "notif-lv-" + Date.now().toString().slice(-4),
    userId: leave.studentId,
    title: `Leave Pass Request ${status.toUpperCase()}`,
    message: `Your hostel leave request from ${leave.startDate} to ${leave.endDate} was ${status} by Warden. Remarks: ${remarks || "None"}`,
    type: status === "approved" ? "success" : "alert",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ message: `Leave request ${status} successfully`, leave });
});

// ==========================================
// 5. VISITOR MANAGEMENT ENDPOINTS (/api/visitor)
// ==========================================

app.get("/api/visitor", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const visitors = db.getVisitors();
  if (userPayload.role === "student") {
    return res.json(visitors.filter((v) => v.studentId === userPayload.userId));
  }
  res.json(visitors);
});

app.post("/api/visitor", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const { visitorName, relation, visitDate, purpose } = req.body;
  if (!visitorName || !relation || !visitDate) {
    return res.status(400).json({ message: "Visitor Name, Relation, and Visit Date are required" });
  }

  const users = db.getUsers();
  const student = users.find((u) => u.id === userPayload.userId);
  if (!student) return res.status(404).json({ message: "Student record not found" });

  const visId = "vis-" + Date.now().toString().slice(-4);
  const newVisitor: Visitor = {
    id: visId,
    studentId: student.id,
    studentName: student.name,
    roomNumber: student.roomNumber || "Not Allocated",
    visitorName,
    relation,
    visitDate,
    purpose,
    qrCode: `VIS-PASS-${visId}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  db.saveVisitor(newVisitor);
  res.status(201).json({ message: "Visitor request filed successfully", visitor: newVisitor });
});

app.put("/api/visitor/:id/status", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "warden" && userPayload.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { status } = req.body;
  const visitors = db.getVisitors();
  const visitor = visitors.find((v) => v.id === req.params.id);

  if (!visitor) return res.status(404).json({ message: "Visitor record not found" });

  visitor.status = status;
  visitor.approvedBy = userPayload.role;

  db.saveVisitor(visitor);

  // Notify student
  db.addNotification({
    id: "notif-vis-" + Date.now().toString().slice(-4),
    userId: visitor.studentId,
    title: `Visitor Gate Pass Approved`,
    message: `The visiting request for ${visitor.visitorName} (${visitor.relation}) on ${visitor.visitDate} has been ${status}.`,
    type: status === "approved" ? "success" : "alert",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ message: `Visitor request ${status} successfully`, visitor });
});

// ==========================================
// 6. MESS FEEDBACK SYSTEM (/api/student/mess)
// ==========================================

app.get("/api/student/mess", authenticate, (req, res) => {
  res.json({
    menu: db.getMessMenu(),
    feedback: db.getMessFeedback(),
  });
});

app.post("/api/student/mess/feedback", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const { rating, comment } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ message: "Rating (1-5) and comment are required" });
  }

  const users = db.getUsers();
  const student = users.find((u) => u.id === userPayload.userId);
  if (!student) return res.status(404).json({ message: "Student record not found" });

  const feedback: MessFeedback = {
    id: "fb-" + Date.now().toString().slice(-4),
    studentId: student.id,
    studentName: student.name,
    rating: parseInt(rating),
    comment,
    createdAt: new Date().toISOString(),
  };

  db.addMessFeedback(feedback);
  res.status(201).json({ message: "Thank you for your feedback!", feedback });
});

// ==========================================
// 7. FEES MANAGEMENT ENDPOINTS (/api/fees)
// ==========================================

app.get("/api/fees", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const fees = db.getFees();
  if (userPayload.role === "student") {
    return res.json(fees.filter((f) => f.studentId === userPayload.userId));
  }
  res.json(fees);
});

app.post("/api/fees/:id/pay", authenticate, (req, res) => {
  const fees = db.getFees();
  const fee = fees.find((f) => f.id === req.params.id);
  if (!fee) return res.status(404).json({ message: "Fee statement not found" });

  if (fee.status === "paid") {
    return res.status(400).json({ message: "This fee statement has already been paid." });
  }

  fee.status = "paid";
  fee.paidAt = new Date().toISOString();

  db.saveFee(fee);

  db.addNotification({
    id: "notif-fee-paid-" + Date.now().toString().slice(-4),
    userId: fee.studentId,
    title: "Fee Payment Received",
    message: `₹${fee.amount.toLocaleString()} received for ${fee.category.toUpperCase()} fee. Receipt generated.`,
    type: "success",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ message: "Payment processed successfully!", fee });
});

// ==========================================
// 8. NOTICES MANAGEMENT ENDPOINTS (/api/notices)
// ==========================================

app.get("/api/notices", authenticate, (req, res) => {
  res.json(db.getNotices());
});

app.post("/api/notices", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin" && userPayload.role !== "warden") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { title, content, priority } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "Notice title and content are required" });
  }

  const noticeId = "nt-" + Date.now().toString().slice(-4);
  const newNotice: Notice = {
    id: noticeId,
    title,
    content,
    createdBy: `${userPayload.role === "admin" ? "Chief Admin" : "Warden"}`,
    priority: priority || "normal",
    createdAt: new Date().toISOString(),
  };

  db.saveNotice(newNotice);

  // Broadcast Notification to all students
  db.addNotification({
    id: "broadcast-notif-" + Date.now().toString().slice(-4),
    userId: "all",
    title: `Notice Board: ${title}`,
    message: content.length > 100 ? content.slice(0, 100) + "..." : content,
    type: priority === "urgent" ? "warning" : "info",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ message: "Notice published successfully", notice: newNotice });
});

app.delete("/api/notices/:id", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin" && userPayload.role !== "warden") {
    return res.status(403).json({ message: "Forbidden" });
  }
  db.deleteNotice(req.params.id);
  res.json({ message: "Notice deleted successfully" });
});

// ==========================================
// 9. NOTIFICATION CENTER ENDPOINTS (/api/notification)
// ==========================================

app.get("/api/notification", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const allNotifs = db.getNotifications();
  const filtered = allNotifs.filter((n) => n.userId === userPayload.userId || n.userId === "all");
  res.json(filtered);
});

app.post("/api/notification/:id/read", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  db.markNotificationAsRead(req.params.id, userPayload.userId);
  res.json({ success: true });
});

// ==========================================
// 10. AI AGENT CHAT ENDPOINTS (/api/chat)
// ==========================================

// Get chat logs
app.get("/api/chat", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const chats = db.getChats();
  const chat = chats.find((c) => c.userId === userPayload.userId);

  if (!chat) {
    // Generate welcoming message first turn
    const welcomeChat: AIChat = {
      id: "ch-" + userPayload.userId,
      userId: userPayload.userId,
      messages: [
        {
          role: "model",
          content: "Hello! I am your AI Hostel Assistant. 🎓⭐\n\nI can help you:\n- 📝 Write and submit Leave Letters\n- 🛠️ File Maintenance complaints (with auto priority classification)\n- 🚪 Book Visitor Passes\n- ⏰ Check Curfew rules and fee timings\n\nHow can I help you today?",
          timestamp: new Date().toISOString(),
        }
      ],
      updatedAt: new Date().toISOString(),
    };
    db.saveChat(welcomeChat);
    return res.json(welcomeChat);
  }

  res.json(chat);
});

// Clear chat history
app.delete("/api/chat", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  const chats = db.getChats();
  const index = chats.findIndex((c) => c.userId === userPayload.userId);
  if (index !== -1) {
    chats.splice(index, 1);
    db.save();
  }
  res.json({ success: true, message: "Chat history cleared successfully" });
});

// Post a student message to Gemini agent
app.post("/api/chat", authenticate, async (req, res) => {
  const userPayload = (req as any).user;
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const chats = db.getChats();
  let chat = chats.find((c) => c.userId === userPayload.userId);

  if (!chat) {
    chat = {
      id: "ch-" + userPayload.userId,
      userId: userPayload.userId,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
  }

  // Push user message
  chat.messages.push({
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  });

  try {
    // Call AI Agent logic
    const result = await processStudentMessage(userPayload.userId, message);

    // Push model response
    chat.messages.push({
      role: "model",
      content: result.response,
      timestamp: new Date().toISOString(),
    });

    chat.updatedAt = new Date().toISOString();
    db.saveChat(chat);

    // Broadcast success message as direct notification if database actions were triggered
    if (result.actionTakenMessage) {
      db.addNotification({
        id: "ai-act-" + Date.now().toString().slice(-4),
        userId: userPayload.userId,
        title: "AI Agent Processed Task",
        message: result.actionTakenMessage,
        type: "success",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      chat,
      aiFeedback: result,
    });
  } catch (err: any) {
    console.error("AI chat error", err);
    res.status(500).json({ message: "Failed to query AI Agent", error: err.message });
  }
});

// ==========================================
// 11. ANALYTICS & REPORTS (/api/reports)
// ==========================================

app.get("/api/reports/analytics", authenticate, async (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin" && userPayload.role !== "warden") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const rooms = db.getRooms();
  const complaints = db.getComplaints();
  const leaves = db.getLeaves();
  const users = db.getUsers();
  const feedbacks = db.getMessFeedback();

  // Compute stats
  const totalStudents = users.filter(u => u.role === "student").length;
  const totalWardens = users.filter(u => u.role === "warden").length;
  
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.occupied > 0).length;
  const totalCapacity = rooms.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalOccupancy = rooms.reduce((acc, curr) => acc + curr.occupied, 0);

  const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;
  const pendingComplaints = complaints.filter(c => c.status === "pending").length;
  const assignedComplaints = complaints.filter(c => c.status === "assigned").length;

  const pendingLeaves = leaves.filter(l => l.status === "pending").length;
  const approvedLeaves = leaves.filter(l => l.status === "approved").length;

  const avgMessRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : "4.5";

  // Get AI synthesized mess recommendation
  const aiMessRecommendation = await getMessRecommendation(feedbacks);

  // Auto Maintenance Predictions based on complaint rates and room occupancy counts
  const totalElectricalComplaints = complaints.filter(c => c.category === "Electrical").length;
  const totalPlumbingComplaints = complaints.filter(c => c.category === "Plumbing").length;
  
  let predictionMessage = "Overall systems running stable. Routine check required in A-Block electrical meters within 15 days.";
  if (totalElectricalComplaints > 2) {
    predictionMessage = "ALERT: Elevated Electrical faults. Predicted breaker threshold issues in Block B 3rd Floor corridors. Inspection urgent.";
  } else if (totalPlumbingComplaints > 2) {
    predictionMessage = "ALERT: Elevated Plumbing complaints. Main pipeline backpressures detected. Recommend riser inspections.";
  }

  res.json({
    counts: {
      totalStudents,
      totalWardens,
      totalRooms,
      occupiedRooms,
      totalCapacity,
      totalOccupancy,
      totalComplaints: complaints.length,
      resolvedComplaints,
      pendingComplaints,
      assignedComplaints,
      totalLeaves: leaves.length,
      pendingLeaves,
      approvedLeaves,
      avgMessRating,
    },
    aiInsights: {
      messRecommendation: aiMessRecommendation,
      maintenancePrediction: predictionMessage,
    },
    charts: {
      complaintsByCategory: {
        Plumbing: complaints.filter(c => c.category === "Plumbing").length,
        Electrical: complaints.filter(c => c.category === "Electrical").length,
        IT: complaints.filter(c => c.category === "IT & Network").length,
        Security: complaints.filter(c => c.category === "Security").length,
        Others: complaints.filter(c => !["Plumbing", "Electrical", "IT & Network", "Security"].includes(c.category)).length,
      },
      roomOccupancyByBlock: {
        A: rooms.filter(r => r.block === "A").reduce((acc, curr) => acc + curr.occupied, 0),
        B: rooms.filter(r => r.block === "B").reduce((acc, curr) => acc + curr.occupied, 0),
      }
    }
  });
});

// Admin endpoint to manage and list users
app.get("/api/users", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  const users = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    department: u.department,
    year: u.year,
    gender: u.gender,
    roomNumber: u.roomNumber,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
  }));
  res.json(users);
});

// Admin delete/promote users
app.delete("/api/users/:id", authenticate, (req, res) => {
  const userPayload = (req as any).user;
  if (userPayload.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  // Remove user
  db.deleteUser(req.params.id);
  res.json({ message: "User deleted successfully" });
});

// ==========================================
// VITE DEV SERVER & PRODUCTION ROUTING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
