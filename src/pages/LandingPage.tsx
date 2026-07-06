import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  Bot, Shield, Calendar, CreditCard, Sparkles, AlertCircle, 
  ChevronDown, MessageSquare, Utensils, Users, CheckCircle, ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

export default function LandingPage() {
  const { user } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoPrompt, setDemoPrompt] = useState<string>("");
  const [demoAIResult, setDemoAIResult] = useState<any | null>(null);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);

  const stats = [
    { label: "Active Residents", value: "1,200+", description: "Fully monitored digitally" },
    { label: "AI Resolved Tasks", value: "99.4%", description: "Autonomously processed" },
    { label: "Maintenance Speed", value: "< 2 Hours", description: "From complaint to plumber" },
    { label: "Security & Safety", value: "24/7 AI Patrol", description: "Automated gate validation" },
  ];

  const features = [
    {
      icon: <Bot className="w-6 h-6 text-[#D4AF37]" />,
      title: "AI Warden Agent",
      description: "Chat in natural language to request room cleaning, apply for leaves, generate passes, or lookup hostel curfews.",
    },
    {
      icon: <Shield className="w-6 h-6 text-[#D4AF37]" />,
      title: "Smart Gate Pass & Visitor Pass",
      description: "Generate digital visitor passes with verified QR codes instantly after warden digital verification.",
    },
    {
      icon: <AlertCircle className="w-6 h-6 text-[#D4AF37]" />,
      title: "AI Priority Complaint Filing",
      description: "Upload room complaints. Our AI automatically classifies priority (Low to Critical) and triggers plumber/electrician alerts.",
    },
    {
      icon: <Utensils className="w-6 h-6 text-[#D4AF37]" />,
      title: "Mess & Nutrition Feedback",
      description: "Explore the live weekly mess menu. Rate meals daily to power AI recommendations for chief mess managers.",
    },
    {
      icon: <Calendar className="w-6 h-6 text-[#D4AF37]" />,
      title: "Hassle-Free Leave Letters",
      description: "Submit leaves online. The AI Agent automatically drafts a formal leave letter for Mr. Suresh Sharma's review.",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-[#D4AF37]" />,
      title: "Integrated Fee Portals",
      description: "View outstanding hostel, mess, and caution deposit balances and clear them securely using a gold-tinted portal.",
    },
  ];

  const benefits = [
    { title: "Zero Paperwork", desc: "No physical registers or applications. Apply, track, and pay online inside a central dashboard." },
    { title: "Predictive Repairs", desc: "AI logs repeating faults (e.g. plumbing backpressure) to predict pipeline maintenance requirements." },
    { title: "24/7 Rule Assistant", desc: "Forgot the curfew timing or electrical fine policies? Ask the bot anytime and get immediate rulebook clarifications." },
  ];

  const faqList = [
    { q: "How does the AI Agent process my leaves and complaints?", a: "When you write in natural language, our Gemini AI parses your parameters (like start date, category, and urgency). It auto-creates the formal ticket, drafts the letter, and puts it inside the Warden queue instantly!" },
    { q: "Is this application mobile friendly?", a: "Yes, it is designed using modern Tailwind responsive breakpoints, perfect for smart devices, laptops, and tablets." },
    { q: "Who approves the visitor and leave passes?", a: "While the AI agent drafts, categorizes, and validates compliance with hostel rules, final approval authorities remain with the assigned hostel Warden (Mr. Suresh Sharma) or Admin." },
    { q: "Can I pay my mess and caution deposits through this portal?", a: "Yes, the portal houses complete fee statements with simulated, premium checkouts for hostel, caution, and mess charges." },
  ];

  // AI Interactive Demo Box on landing page
  const handleTryDemo = async (promptText: string) => {
    setDemoPrompt(promptText);
    setDemoLoading(true);
    setDemoAIResult(null);

    // Simulate safe local demo AI results to show off AI capability immediately
    setTimeout(() => {
      let mockResult = {
        intent: "complaint",
        category: "Plumbing",
        priority: "high",
        summary: "Water is leaking, causing a wet floor in room B-302.",
        letter: "Respected Warden, I request leave for 3 days starting tomorrow due to medical emergency...",
      };

      if (promptText.toLowerCase().includes("leave")) {
        mockResult.intent = "leave_request";
        mockResult.summary = "Student needs leave tomorrow to travel home.";
      } else if (promptText.toLowerCase().includes("visitor")) {
        mockResult.intent = "visitor";
        mockResult.summary = "Requesting guest entry for parents.";
      }

      setDemoAIResult(mockResult);
      setDemoLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-zinc-100 flex flex-col font-sans">
      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gold-gradient-bg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <Bot className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white font-sans">
              HERA <span className="text-[#D4AF37]">Hostel AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ai-benefits" className="hover:text-white transition-colors">AI Advantages</a>
            <a href="#stats" className="hover:text-white transition-colors">Statistics</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-950 gold-gradient-bg rounded-lg hover:brightness-110 transition-all font-sans"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-zinc-300 hover:text-white text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-950 gold-gradient-bg rounded-lg hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] font-sans"
                >
                  Join Hostel
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden px-4">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-[#D4AF37] mb-6 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Final Year Major Project Portfolio Entry</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 font-sans">
              Autonomous <span className="gold-gradient-text">Hostel Management</span> <br/>
              Powered by AI Agents
            </h1>
            
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              HERA simplifies residential life. Submit complaints with automatic AI classification, 
              generate warden-compliant leave letters instantly, and manage fees in a luxury, black-and-gold environment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#F5C542] text-zinc-950 font-bold uppercase text-xs tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2"
              >
                Get Started Now <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#demo" 
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-zinc-800 transition-all"
              >
                Explore Interactive Demo
              </a>
            </div>
          </motion.div>

          {/* 3. Interactive AI Demo Showcase */}
          <div id="demo" className="max-w-4xl mx-auto bg-[#161616] rounded-2xl border border-zinc-800 p-6 md:p-8 text-left gold-glow relative">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">HERA Interactive Sandboxed Agent</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Live Demo Input</p>
                </div>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4 font-medium">Click a quick prompt below to test how our AI Agent structures requests:</p>
            
            <div className="flex flex-wrap gap-2.5 mb-6">
              <button 
                onClick={() => handleTryDemo("My room ceiling is leaking water in B-302")}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-all hover:border-[#D4AF37]/30 text-left"
              >
                💧 "Water leakage in B-302"
              </button>
              <button 
                onClick={() => handleTryDemo("I need leave starting tomorrow for 3 days to go home")}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-all hover:border-[#D4AF37]/30 text-left"
              >
                🚗 "Leave for 3 days"
              </button>
              <button 
                onClick={() => handleTryDemo("My mother Sunita Roy is visiting me this Thursday")}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-all hover:border-[#D4AF37]/30 text-left"
              >
                👩 "Parent is visiting"
              </button>
            </div>

            <div className="bg-[#0B0B0B] rounded-xl p-4 border border-zinc-800/80 min-h-[140px] flex flex-col justify-between">
              {demoLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-[#D4AF37] font-mono animate-pulse">HERA Agent analyzing syntax & parsing payload...</p>
                </div>
              ) : demoAIResult ? (
                <div className="space-y-4 fade-in-slide">
                  <div className="flex items-start gap-3">
                    <Bot className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#F5C542]">Processed Intent: <span className="uppercase font-mono text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-white ml-1">{demoAIResult.intent}</span></p>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {demoAIResult.intent === "complaint" ? (
                          <>
                            <strong>Auto-Categorized:</strong> {demoAIResult.category} | <strong>Priority Detected:</strong> <span className="text-red-400 font-bold uppercase">{demoAIResult.priority}</span> <br/>
                            <strong>Generated Summary:</strong> "{demoAIResult.summary}"
                          </>
                        ) : (
                          <>
                            <strong>Parsed Action:</strong> {demoAIResult.summary} <br/>
                            <strong>Auto-Generated Warden Letter Draft:</strong><br/>
                            <span className="block p-3 rounded bg-zinc-900/60 mt-2 font-serif text-xs text-zinc-300 leading-relaxed border border-zinc-800">
                              {demoAIResult.letter}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">Status: Task generated in Student memory store</span>
                    <Link to="/login" className="text-xs text-[#D4AF37] font-bold flex items-center gap-1 hover:underline">
                      Test inside Dashboard <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
                  <MessageSquare className="w-8 h-8 mb-2" />
                  <p className="text-xs font-mono">Select a preset prompt above to view AI agent extraction details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bento Grid Features Section */}
      <section id="features" className="py-20 bg-[#0F0F0F] border-y border-zinc-800/40 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              A Complete <span className="text-[#D4AF37]">Hostel Ecosystem</span>
            </h2>
            <p className="text-zinc-400 text-sm">
              We replaced outdated Excel files and registers with a fluid, autonomous dashboard layout built for Students, Wardens, and Chief Admins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, idx) => (
              <div 
                key={idx}
                className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 hover:border-[#D4AF37]/30 transition-all hover:translate-y-[-4px] duration-300 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed flex-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI Benefits & Advantages */}
      <section id="ai-benefits" className="py-20 px-4 relative">
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-[#D4AF37]/2 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest font-mono">AI Advantage</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-3 mb-6 leading-tight">
              Why HERA is Smarter <br/>
              than legacy hostel software
            </h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Standard systems require manual categorization and endless warden reviews. 
              HERA utilizes Gemini AI models to analyze sentiments, detect complaint urgencies immediately, 
              and schedule plumber dispatches, freeing staff from redundant administration.
            </p>
            
            <div className="space-y-6">
              {benefits.map((b, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">{b.title}</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#D4AF37]" /> AI Sentiment & Classification Engine
            </h3>
            
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between text-zinc-500 mb-1">
                  <span>Input Message</span>
                  <span className="text-[#D4AF37]">Parsed</span>
                </div>
                <p className="text-zinc-300 font-sans italic">"The study hall fan is sparking wildly and making weird sounds."</p>
                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-2">
                  <span className="bg-red-950/40 text-red-400 px-2 py-0.5 rounded border border-red-900/40">Urgency: Critical</span>
                  <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">Category: Electrical</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between text-zinc-500 mb-1">
                  <span>Input Message</span>
                  <span className="text-[#D4AF37]">Parsed</span>
                </div>
                <p className="text-zinc-300 font-sans italic">"I have a cold and the Wednesday lunch dal was way too cold and uncooked."</p>
                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-2">
                  <span className="bg-yellow-950/40 text-yellow-400 px-2 py-0.5 rounded border border-yellow-900/40">Sentiment: Frustrated</span>
                  <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">Action: Log Food Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hostel Statistics Grid */}
      <section id="stats" className="py-20 bg-zinc-950/60 border-t border-zinc-800/40 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <div key={idx} className="text-center p-4 bg-[#161616]/60 rounded-xl border border-zinc-800/60">
                <p className="text-3xl md:text-4xl font-extrabold text-[#D4AF37] font-sans tracking-tight mb-2">{s.value}</p>
                <h4 className="text-xs font-semibold text-white tracking-wide mb-1 uppercase">{s.label}</h4>
                <p className="text-[10px] text-zinc-500">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-zinc-400 text-xs mt-2">Everything you need to know about our major portfolio project.</p>
        </div>

        <div className="space-y-4">
          {faqList.map((faq, idx) => (
            <div key={idx} className="border border-zinc-800 rounded-xl overflow-hidden bg-[#161616]">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:bg-zinc-900/30 transition-all"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${activeFaq === idx ? "rotate-180" : ""}`} />
              </button>
              {activeFaq === idx && (
                <div className="p-5 pt-0 border-t border-zinc-800/50 text-xs text-zinc-400 leading-relaxed bg-[#0F0F0F] fade-in-slide">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Contact Section */}
      <section className="py-20 px-4 bg-[#0F0F0F] border-t border-zinc-800/40">
        <div className="max-w-md mx-auto bg-[#161616] p-6 sm:p-8 rounded-2xl border border-zinc-800 text-left">
          <h3 className="text-lg font-bold text-white mb-2">Connect With HERA Admin</h3>
          <p className="text-xs text-zinc-400 mb-6">Need general information or customized institutional hosting? Drop us a line.</p>
          
          <form onSubmit={(e) => { e.preventDefault(); alert("Message sent! This is a demo endpoint."); }} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Your Name</label>
              <input type="text" placeholder="Ananya Roy" required className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Email Address</label>
              <input type="email" placeholder="ananya@college.edu" required className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Message</label>
              <textarea rows={4} placeholder="Type your inquiry..." required className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none" />
            </div>
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F5C542] text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="mt-auto bg-[#0B0B0B] border-t border-zinc-900 py-8 px-4 text-center text-zinc-600 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#D4AF37]/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <span className="font-bold text-white">HERA Hostel AI</span>
          </div>
          <p>© 2026 HERA Autonomous Systems. Built for Final Year Major Engineering Portfolio presentation.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
