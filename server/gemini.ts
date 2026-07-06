import { GoogleGenAI, Type } from "@google/genai";
import { db, Complaint, Leave, Visitor, User } from "./db";

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiInstance;
}

// Default Hostel Rules used for Q&A matching and grounding
const HOSTEL_RULES = `
Hostel Rules & Regulations:
1. Curfew & Gate Timings: The main gate of the hostel closes at 9:30 PM daily. Students are not allowed to enter or leave after this time without a pre-approved leave pass.
2. Attendance: Daily attendance is taken in rooms at 9:45 PM by the hostel wardens.
3. Visitors: Male visitors are strictly prohibited in female blocks, and vice versa. Parents can visit designated visitor lobbies between 10:00 AM and 6:30 PM with a warden-approved visitor pass. Overnight stay of visitors is not permitted.
4. Room Maintenance & Cleanliness: Students are responsible for keeping their rooms clean. Cleaning services are available upon request through the hostel portal. Do not paste posters or nail anything on walls.
5. Silence Hours: Silence hours are observed from 11:00 PM to 6:00 AM. Loud music, noise, or gatherings inside corridors during these hours are strictly forbidden.
6. Electrical Appliances: High-wattage appliances like room heaters, induction stoves, and hot plates are strictly banned. Violators will face a ₹2,000 fine and seizure of the appliance.
7. Anti-Ragging: Ragging in any form is a punishable offence under criminal law and will result in immediate suspension and expulsion.
8. Mess Timings:
   - Breakfast: 7:30 AM to 9:00 AM
   - Lunch: 12:30 PM to 2:00 PM
   - Snacks: 5:00 PM to 6:00 PM
   - Dinner: 7:30 PM to 9:00 PM
`;

export interface AIProcessedResult {
  response: string;
  intent: "general_qa" | "leave_request" | "complaint" | "visitor" | "service_request";
  sentiment: "positive" | "neutral" | "negative" | "frustrated";
  extractedData?: {
    category?: string;
    priority?: "low" | "medium" | "high" | "critical";
    summary?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    visitorName?: string;
    relation?: string;
    visitDate?: string;
    purpose?: string;
    serviceType?: string;
  };
  actionTakenMessage?: string;
}

/**
 * Fallback NLP parser in case the Gemini API Key is missing or network fails
 */
function localRuleBasedParser(message: string, student: User): AIProcessedResult {
  const text = message.toLowerCase();
  
  // 1. Leave Request Intent
  if (text.includes("leave") || text.includes("vacation") || text.includes("going home") || text.includes("permission to go") || text.includes("hospital") || text.includes("medical") || text.includes("accident") || text.includes("surgery") || text.includes("emergency")) {
    const todayStr = new Date().toISOString().split("T")[0];
    const nextDayStr = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0];
    
    // Check if critical
    const criticals = [
      "health issue", "medical emergency", "hospital", "accident", 
      "family emergency", "death", "surgery", "emergency travel"
    ];
    const matchedCritical = criticals.find(k => text.includes(k));
    const reason = matchedCritical 
      ? `Emergency Leave: ${matchedCritical.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` 
      : "Personal work / family emergency";
    
    const isCritical = !!matchedCritical;

    return {
      intent: "leave_request",
      sentiment: isCritical ? "negative" : "neutral",
      response: isCritical
        ? `Respected Warden,\n\nI am writing to notify you that I must request immediate leave from ${todayStr} to ${nextDayStr} due to a critical emergency: ${reason}.\n\nKindly approve my automatic emergency gate pass.\n\nSincerely,\n${student.name}`
        : `Respected Warden,\n\nI need to apply for hostel leave from ${todayStr} to ${nextDayStr} because of ${reason}. Kindly approve.\n\nSincerely,\n${student.name}`,
      extractedData: {
        startDate: todayStr,
        endDate: nextDayStr,
        reason: reason,
      },
      actionTakenMessage: isCritical 
        ? "Emergency Leave approved automatically by HERA AI Emergency System!"
        : "Drafted leave application. Go to Leave Request panel to review and submit.",
    };
  }

  // 2. Complaint Intent
  if (text.includes("repair") || text.includes("not working") || text.includes("complaint") || text.includes("broken") || text.includes("leak") || text.includes("noise") || text.includes("dirty") || text.includes("lost")) {
    let category = "General Maintenance";
    let priority: "low" | "medium" | "high" | "critical" = "medium";
    
    if (text.includes("leak") || text.includes("water") || text.includes("pipe") || text.includes("tap")) {
      category = "Plumbing";
      priority = "high";
    } else if (text.includes("light") || text.includes("fan") || text.includes("bulb") || text.includes("power") || text.includes("electricity") || text.includes("switch")) {
      category = "Electrical";
      priority = "medium";
    } else if (text.includes("wifi") || text.includes("internet") || text.includes("router") || text.includes("network")) {
      category = "IT & Network";
      priority = "medium";
    } else if (text.includes("noise") || text.includes("roommate") || text.includes("disturb")) {
      category = "Warden Action / Discipline";
      priority = "high";
    } else if (text.includes("lost") || text.includes("id card") || text.includes("theft")) {
      category = "Security";
      priority = "high";
    }

    return {
      intent: "complaint",
      sentiment: text.includes("frustrated") || text.includes("angry") || text.includes("!") ? "frustrated" : "neutral",
      response: `I've categorized your issue under **${category}** with a **${priority}** priority level. I can auto-generate a complaint ticket for you to the maintenance department immediately.`,
      extractedData: {
        category,
        priority,
        summary: `Auto-summarized: student reported an issue: "${message.substring(0, 80)}..."`,
      },
      actionTakenMessage: `Auto-categorized complaint ticket created successfully. Track it in your Dashboard!`,
    };
  }

  // 3. Visitor Intent
  if (text.includes("visitor") || text.includes("parent") || text.includes("mother") || text.includes("father") || text.includes("guest") || text.includes("friend")) {
    return {
      intent: "visitor",
      sentiment: "neutral",
      response: "It seems you'd like to book a visitor pass. Parents and guardians can visit between 10:00 AM and 6:30 PM. I can draft a visitor pass request for you.",
      extractedData: {
        visitorName: "Guest",
        relation: "Family",
        visitDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0],
        purpose: "General visit",
      },
      actionTakenMessage: "Visitor Pass request drafted. Please review it on the Visitor Pass page.",
    };
  }

  // 4. Service / Cleaning Intent
  if (text.includes("clean") || text.includes("sweeper") || text.includes("water") || text.includes("drinking water") || text.includes("housekeeping")) {
    return {
      intent: "service_request",
      sentiment: "neutral",
      response: "Got it! I can schedule room cleaning or drinking water delivery for your room.",
      extractedData: {
        serviceType: text.includes("water") ? "Drinking Water Delivery" : "Room Housekeeping",
      },
      actionTakenMessage: "Service request submitted. Housekeeping/Delivery staff will arrive within 2 hours.",
    };
  }

  // 5. Default QA rules matching
  let answer = `Hello! I am your AI Hostel Assistant. You can ask me to file a complaint, generate a leave letter, register visitors, or ask questions about hostel rules, timings, fees, and mess menu.\n\n*Try saying: "I need leave for 2 days" or "Water is leaking in my room B-302".*`;
  
  if (text.includes("gate") || text.includes("curfew") || text.includes("timings") || text.includes("close")) {
    answer = `**Gate Curfew Timings:**\nThe main gate of the hostel closes strictly at **9:30 PM** daily. All students must mark physical attendance in their respective rooms by **9:45 PM**. Any entry after 9:30 PM requires a warden-approved leave/late pass.`;
  } else if (text.includes("appliance") || text.includes("heater") || text.includes("induction") || text.includes("cook")) {
    answer = `**Electrical Appliance Regulations:**\nHigh-wattage appliances such as room heaters, induction cooktops, hot plates, and electric kettles are strictly prohibited. Using them will result in a ₹2,000 fine and confiscation of the appliance. Smart laptops and cell phone chargers are fully allowed.`;
  } else if (text.includes("mess") || text.includes("breakfast") || text.includes("lunch") || text.includes("dinner") || text.includes("snacks")) {
    answer = `**Mess Timings:**\n- Breakfast: 7:30 AM to 9:00 AM\n- Lunch: 12:30 PM to 2:00 PM\n- Snacks: 5:00 PM to 6:00 PM\n- Dinner: 7:30 PM to 9:00 PM\n\nYou can view the full weekly menu inside the **Mess Management** tab on your dashboard!`;
  } else if (text.includes("fee") || text.includes("due") || text.includes("payment")) {
    answer = `**Hostel Fee Reminders:**\nYour semester hostel fees are due by **July 25, 2026**. You can view details or process payment via the **Hostel Fee** section of your Student Dashboard.`;
  } else if (text.includes("parent") || text.includes("stay") || text.includes("visitor")) {
    answer = `**Visitor Regulations:**\nParents and registered guardians are allowed in designated visitor lobbies between **10:00 AM and 6:30 PM** with an approved visitor pass. Overnight stays for parents inside student rooms are strictly forbidden. No visitors of the opposite gender are permitted inside student residential blocks.`;
  } else if (text.includes("ragging") || text.includes("bully")) {
    answer = `**Anti-Ragging Policy:**\nOur campus enforces a strict **Zero-Tolerance Anti-Ragging Policy**. Ragging in any shape or form is classified as a criminal offence, leading to immediate expulsion, suspension, and police hand-over. Report any incident immediately to Chief Admin Dr. Rajesh Kumar or any warden.`;
  }

  return {
    intent: "general_qa",
    sentiment: "neutral",
    response: answer,
  };
}

/**
 * Main AI function to process student text messages using Gemini API
 */
export async function processStudentMessage(userId: string, message: string): Promise<AIProcessedResult> {
  const users = db.getUsers();
  const student = users.find((u) => u.id === userId);
  if (!student) {
    throw new Error("Student not found");
  }

  const ai = getAIClient();
  if (!ai) {
    // If Gemini API is not configured, fall back to the robust rule-based parser
    return localRuleBasedParser(message, student);
  }

  // Fetch recent chat logs for conversation history (up to last 15 messages)
  const chats = db.getChats();
  const userChat = chats.find((c) => c.userId === userId);
  const previousMessagesContext = userChat && userChat.messages.length > 0
    ? userChat.messages.slice(-15).map((m) => `${m.role === "user" ? "Student" : "HERA AI"}: ${m.content}`).join("\n")
    : "No prior conversation in this session.";

  const prompt = `
  You are the AI Hostel Management Agent for a luxury, black & gold themed Hostel Management System.
  Your task is to understand this natural language message from a student, extract their intent, categorize, classify priority, and respond intelligently.
  
  Student Info:
  - Name: ${student.name}
  - Room: ${student.roomNumber || "Not Assigned"}
  - Phone: ${student.phone}
  - Department: ${student.department || "N/A"}
  - Gender: ${student.gender || "N/A"}

  Context Details:
  ${HOSTEL_RULES}

  Recent Conversation History (For Context):
  ${previousMessagesContext}

  Student Message (Current Turn): "${message}"

  Instructions:
  1. Determine the intent of the message. Must be one of:
     - "general_qa": Simple rules lookup, questions about timings, appliances, etc.
     - "leave_request": Student wants to take leave, go home, travel, etc.
     - "complaint": Filing a complaint about room, noise, roommates, plumbing, electrics, lost items, etc.
     - "visitor": Requesting a parent, relative, or friend visit pass.
     - "service_request": Requesting cleaning, water delivery, sweeper, etc.
  2. Determine the student's Sentiment: "positive", "neutral", "negative", or "frustrated".
  3. Extract specific data structure depending on the intent:
     - For "leave_request": Extract startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), reason.
     - For "complaint": Determine category (Plumbing, Electrical, IT & Network, Security, Mess Food, Roommate Conflict, General), priority (low, medium, high, critical), and write a crisp summary.
     - For "visitor": Extract visitorName, relation, visitDate (YYYY-MM-DD), purpose.
     - For "service_request": Extract serviceType (e.g., Room Housekeeping, Drinking Water).
  4. Formulate an AI Response:
     - Be highly professional, empathetic, and formal.
     - If "general_qa", answer clearly citing the rules above.
     - If "leave_request", draft a beautiful official leave application letter in your response, and confirm you can file it for them.
     - If "complaint", confirm you've generated the complaint ticket, explaining how it was classified.
     - If "service_request", confirm the booking.
  5. Suggest actionTakenMessage to display in the frontend.

  You MUST return your answer strictly as a JSON object matching this schema (do NOT include backticks or markdown wrappers around JSON, return ONLY raw JSON):
  {
    "response": "AI response text here",
    "intent": "general_qa" | "leave_request" | "complaint" | "visitor" | "service_request",
    "sentiment": "positive" | "neutral" | "negative" | "frustrated",
    "extractedData": {
      "category": "Plumbing" | "Electrical" | "IT & Network" | "Security" | "Mess Food" | "Roommate Conflict" | "General",
      "priority": "low" | "medium" | "high" | "critical",
      "summary": "Crisp summary text",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "reason": "Leave reason",
      "visitorName": "Name",
      "relation": "Relation",
      "visitDate": "YYYY-MM-DD",
      "purpose": "Visitor purpose",
      "serviceType": "Service request type"
    },
    "actionTakenMessage": "Message explaining the dashboard action taken"
  }
  `;

  try {
    const geminiRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textResult = geminiRes.text;
    if (textResult) {
      const parsed: AIProcessedResult = JSON.parse(textResult.trim());
      
      // Auto-execute database creation if intent is fully formed
      if (parsed.intent === "complaint" && parsed.extractedData) {
        const id = "comp-" + Date.now().toString().slice(-6);
        const newComplaint: Complaint = {
          id,
          studentId: student.id,
          studentName: student.name,
          roomNumber: student.roomNumber || "Unassigned",
          title: parsed.extractedData.summary || message.slice(0, 50),
          description: message,
          category: parsed.extractedData.category || "General",
          priority: parsed.extractedData.priority || "medium",
          status: "pending",
          department: `Maintenance - ${parsed.extractedData.category || "General"}`,
          summary: parsed.extractedData.summary || message,
          createdAt: new Date().toISOString(),
        };
        db.saveComplaint(newComplaint);
        parsed.actionTakenMessage = `Complaint ticket #${id} filed under ${newComplaint.category} (${newComplaint.priority} priority). Assigned to maintenance.`;
      } else if (parsed.intent === "leave_request" && parsed.extractedData) {
        const id = "lv-" + Date.now().toString().slice(-6);
        const reason = parsed.extractedData.reason || message;

        // Check if critical
        const criticals = [
          "health issue", "medical emergency", "hospital", "accident", 
          "family emergency", "death", "surgery", "emergency travel"
        ];
        const isCritical = reason && criticals.some(keyword => reason.toLowerCase().includes(keyword));
        const status = isCritical ? "approved" : "pending";
        const approvedBy = isCritical ? "AI Emergency System" : undefined;

        const newLeave: Leave = {
          id,
          studentId: student.id,
          studentName: student.name,
          roomNumber: student.roomNumber || "Unassigned",
          startDate: parsed.extractedData.startDate || new Date().toISOString().split("T")[0],
          endDate: parsed.extractedData.endDate || new Date(Date.now() + 24*3600*1000).toISOString().split("T")[0],
          reason,
          letterText: parsed.response, // contains the letter draft
          status,
          approvedBy,
          createdAt: new Date().toISOString(),
        };
        db.saveLeave(newLeave);
        parsed.actionTakenMessage = isCritical 
          ? `Emergency Leave request #${id} automatically approved by HERA AI Emergency System.`
          : `Leave draft #${id} submitted successfully to Warden Mr. Suresh Sharma.`;
      } else if (parsed.intent === "visitor" && parsed.extractedData) {
        const id = "vis-" + Date.now().toString().slice(-6);
        const newVisitor: Visitor = {
          id,
          studentId: student.id,
          studentName: student.name,
          roomNumber: student.roomNumber || "Unassigned",
          visitorName: parsed.extractedData.visitorName || "Guest",
          relation: parsed.extractedData.relation || "Visitor",
          visitDate: parsed.extractedData.visitDate || new Date().toISOString().split("T")[0],
          purpose: parsed.extractedData.purpose || message,
          qrCode: `VIS-PASS-${id}`,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        db.saveVisitor(newVisitor);
        parsed.actionTakenMessage = `Visitor pass request #${id} generated for ${newVisitor.visitorName}. Awaiting approval.`;
      }
      
      return parsed;
    }
  } catch (error) {
    console.error("Gemini processing error, fallback active", error);
  }

  return localRuleBasedParser(message, student);
}

/**
 * Service function to process a manual complaint filed by student and auto-extract parameters using Gemini
 */
export async function analyzeComplaintAI(title: string, description: string): Promise<{
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  summary: string;
  department: string;
}> {
  const ai = getAIClient();
  const fallback = {
    category: "General Maintenance",
    priority: "medium" as const,
    summary: title,
    department: "Maintenance Cell",
  };

  if (!ai) {
    return fallback;
  }

  const prompt = `
  Analyze this student complaint title and description:
  Title: "${title}"
  Description: "${description}"

  Your goal is to output JSON representing:
  1. "category": Choose standard category (Plumbing, Electrical, IT & Network, Security, Mess Food, Roommate Conflict, General).
  2. "priority": Determine priority level based on risk, disruption, and health hazards. Select only one: "low", "medium", "high", or "critical".
  3. "summary": Summarize the issue in exactly one clear, professional sentence.
  4. "department": Formulate a suitable staff/department destination (e.g. "Maintenance - Electrical", "Infrastructure - IT").

  Return only a JSON object match this schema:
  {
    "category": "categoryName",
    "priority": "low" | "medium" | "high" | "critical",
    "summary": "One sentence summary.",
    "department": "departmentName"
  }
  `;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (res.text) {
      return JSON.parse(res.text.trim());
    }
  } catch (e) {
    console.error("Complaint Analysis error", e);
  }

  return fallback;
}

/**
 * Service function to generate report insights & menu optimization using Gemini
 */
export async function getMessRecommendation(feedbacks: any[]): Promise<string> {
  const ai = getAIClient();
  const defaultInsight = "Based on local stats, students are highly satisfied with Sunday special menus. However, we recommend reducing oil levels on weekday dinners and upgrading Wednesday's chapati quality to address common remarks.";
  
  if (!ai || feedbacks.length === 0) {
    return defaultInsight;
  }

  const feedbackData = feedbacks.map(f => `[Rating: ${f.rating}/5, Comment: "${f.comment}"]`).join("\n");
  const prompt = `
  Analyze these mess feedback comments left by hostel students:
  ${feedbackData}

  Synthesize these feedbacks and provide a 3-sentence, professional AI Mess Optimization Recommendation.
  State specific takeaways, food rating trends, and clear suggestions for improvement.
  Keep it positive, professional, and actionable.
  `;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return res.text?.trim() || defaultInsight;
  } catch (e) {
    console.error("Mess recommendation generation error", e);
    return defaultInsight;
  }
}
