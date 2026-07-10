import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Custom JWT Auth logic will go here
    console.log("Login with:", email, password);
    navigate("/dashboard");
  };

  return (
    <div className="bg-slate-700 flex items-center justify-center min-h-screen p-4 font-sans selection:bg-blue-200">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="text-center space-y-3 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100/70 rounded-2xl flex items-center justify-center text-[#1e40af] mb-1 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#0f172a]">Welcome</h2>
            <p className="text-sm text-[#64748b]">Sign in to your account</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400"
              >
                {passwordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors mt-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-sm text-[#64748b] pt-2">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="font-bold text-[#1e40af] hover:underline focus:outline-none"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
