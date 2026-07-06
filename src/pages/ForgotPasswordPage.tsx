import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { Bot, Mail, KeyRound, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Please enter your email", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      setOtpCode(res.otpCode);
      setStep(2);
      showToast(res.message, "success");
    } catch (e: any) {
      showToast(e.message || "Failed to initiate recovery", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || !newPassword) {
      showToast("Please fill in all fields", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.resetPassword({
        email,
        otp: resetOtp,
        newPassword,
      });
      showToast(res.message, "success");
      navigate("/login");
    } catch (e: any) {
      showToast(e.message || "Password reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col justify-center items-center px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel-gold rounded-2xl p-8 shadow-2xl relative z-10 border border-[#D4AF37]/15">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gold-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <KeyRound className="w-6 h-6 text-zinc-950 font-bold" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2 font-sans">
            {step === 1 ? "Recover Password" : "Set New Password"}
          </h2>
          <p className="text-zinc-400 text-xs font-medium">
            {step === 1 
              ? "We will send an OTP verification code to reset your account"
              : "Verify code and type your secure new password"
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium tracking-wide uppercase text-[10px]">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="student@hostel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F5C542] text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all font-sans shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
            >
              {loading ? "Verifying email..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5 text-xs">
            {/* Visual Simulator Sandbox Helper */}
            {otpCode && (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-[#D4AF37]/30 text-xs text-zinc-300">
                <p className="font-semibold text-[#F5C542] flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Sandbox Recovery Simulator
                </p>
                <p>The system auto-generated password OTP is: <strong className="font-mono text-white text-sm bg-black px-2 py-0.5 rounded border border-zinc-800 ml-1">{otpCode}</strong></p>
              </div>
            )}

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium tracking-wide uppercase text-[10px]">Enter 4-Digit OTP</label>
              <input
                type="text"
                maxLength={4}
                placeholder="4-digit code"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 text-white text-center text-sm font-bold tracking-widest focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium tracking-wide uppercase text-[10px]">New Secure Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F5C542] text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all font-sans shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
            >
              {loading ? "Updating credentials..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-center text-zinc-500 text-xs mt-6 font-sans">
          Remember password?{" "}
          <Link to="/login" className="text-[#D4AF37] hover:underline font-semibold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
