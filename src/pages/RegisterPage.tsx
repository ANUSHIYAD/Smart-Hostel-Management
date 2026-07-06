import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Bot, User, Mail, Phone, Lock, Eye, Building, GraduationCap, Users } from "lucide-react";

export default function RegisterPage() {
  const { user, register, loading, showToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("First Year");
  const [gender, setGender] = useState("Female");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !password || !confirmPassword) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (password.length < 5) {
      showToast("Password must be at least 5 characters long", "warning");
      return;
    }

    try {
      const res = await register({
        name,
        email,
        phone,
        department,
        year,
        gender,
        password,
      });
      // Context will handle toast & state update
      navigate("/dashboard");
    } catch (err: any) {
      // Errors handled inside central AppContext
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col justify-center items-center py-12 px-4 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#D4AF37]/4 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-xl w-full glass-panel-gold rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 border border-[#D4AF37]/15">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            <Bot className="w-5 h-5 text-zinc-950 font-bold" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1 font-sans">Resident Registration</h2>
          <p className="text-zinc-400 text-xs font-medium">Create your credentials to join HERA AI Smart Hostel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium tracking-wide uppercase text-[9px]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ananya Roy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium tracking-wide uppercase text-[9px]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="ananya@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium tracking-wide uppercase text-[9px]">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium tracking-wide uppercase text-[9px]">Department</label>
              <div className="relative">
                <Building className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Computer Science & Eng."
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium tracking-wide uppercase text-[9px]">Academic Year</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer"
                >
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium tracking-wide uppercase text-[9px]">Gender Identity</label>
              <div className="relative">
                <Users className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium tracking-wide uppercase text-[9px]">Avatar Upload</label>
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-zinc-500 hover:text-white border-dashed text-center cursor-pointer hover:border-[#D4AF37]/50 transition-all flex items-center justify-center gap-1.5">
                <span>📁 Upload mock image</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium tracking-wide uppercase text-[9px]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-10 text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium tracking-wide uppercase text-[9px]">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F5C542] text-zinc-950 font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all font-sans shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50 mt-2"
          >
            {loading ? "Creating digital record..." : "Register Securely"}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-xs mt-6 font-sans">
          Already have an account?{" "}
          <Link to="/login" className="text-[#D4AF37] hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
