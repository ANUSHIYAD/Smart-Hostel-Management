import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Bot, Mail, Lock, Sparkles, UserCheck } from "lucide-react";

export default function LoginPage() {
  const { user, login, loading, showToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields", "warning");
      return;
    }
    try {
      await login(email, password, rememberMe);
    } catch (err) {
      // toast is handled in AppContext
    }
  };

  // Quick helper for evaluation demo logins
  const handleQuickLogin = (role: "student" | "warden" | "admin") => {
    if (role === "student") {
      setEmail("student@hostel.com");
      setPassword("student");
    } else if (role === "warden") {
      setEmail("warden@hostel.com");
      setPassword("warden");
    } else if (role === "admin") {
      setEmail("admin@hostel.com");
      setPassword("admin");
    }
    showToast(`Quick-filled ${role} credentials!`, "info");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col justify-center items-center px-4 relative">
      {/* Background glow ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel-gold rounded-2xl p-8 shadow-2xl relative z-10 border border-[#D4AF37]/15">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gold-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <Bot className="w-6 h-6 text-zinc-950 font-bold animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2 font-sans">
            Welcome to <span className="text-[#D4AF37]">HERA AI</span>
          </h2>
          <p className="text-zinc-400 text-xs font-medium">Log in to manage your smart hostel activities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1.5 font-medium tracking-wide uppercase text-[10px]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="student@hostel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37] font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-zinc-400 font-medium tracking-wide uppercase text-[10px]">Password</label>
              <Link to="/forgot-password" className="text-[#D4AF37] hover:underline text-[10px] font-medium">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37] font-sans"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-400 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-800 text-[#D4AF37] focus:ring-0 bg-zinc-900 w-3.5 h-3.5"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F5C542] text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all font-sans shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
          >
            {loading ? "Authenticating session..." : "Login Securely"}
          </button>
        </form>

        {/* Quick evaluation logins panel */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-3 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Evaluator quick role-autofills
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin("student")}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800/80 rounded border border-zinc-800 text-[10px] text-zinc-300 font-sans transition-all text-center flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-[#D4AF37]" /> Student
            </button>
            <button
              onClick={() => handleQuickLogin("warden")}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800/80 rounded border border-zinc-800 text-[10px] text-zinc-300 font-sans transition-all text-center flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-[#D4AF37]" /> Warden
            </button>
            <button
              onClick={() => handleQuickLogin("admin")}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800/80 rounded border border-zinc-800 text-[10px] text-zinc-300 font-sans transition-all text-center flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-[#D4AF37]" /> Admin
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6 font-sans">
          New resident?{" "}
          <Link to="/register" className="text-[#D4AF37] hover:underline font-semibold">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
}
