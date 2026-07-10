import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import appLogo from "../../assets/Career Compass Logo.png";
import ResumeUploadModal from "../modals/ResumeUploadModal";
import {
  LayoutDashboard,
  UploadCloud,
  Target,
  Puzzle,
  Map,
  Settings,
  LogOut,
  Search,
  Bell,
  Upload,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BookOpen,
  Lock,
  TrendingUp,
  X,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  // Mock user for now since we removed Clerk
  const user = {
    firstName: "Demo",
    fullName: "Demo User",
    imageUrl: null,
    primaryEmailAddress: { emailAddress: "demo@example.com" }
  };

  // Functional Application States
  const [targetRole, setTargetRole] = useState("Frontend Engineer");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleSignOut = () => {
    // Add custom JWT sign out logic here later
    navigate("/");
  };

  const handleAnalyzeRole = () => {
    if (!targetRole.trim()) return;
    alert(`Analyzing resume match for: ${targetRole}`);
  };

  return (
    <div className="flex h-screen bg-[#f4f7fb] font-sans text-slate-800 selection:bg-indigo-100">
      {/* ==================== SIDEBAR ==================== */}
      <aside className="w-64 bg-[#1e1a4f] flex flex-col h-full shrink-0">
        <div className="h-20 px-6 flex flex-col justify-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <img
              src={appLogo}
              alt="CareerCompass"
              className="w-7 h-7 object-contain"
            />
            <span className="text-xl font-bold text-white tracking-tight">
              CareerCompass
            </span>
          </div>
          <span className="text-[9px] font-mono text-indigo-300/80 tracking-[0.2em] mt-1 ml-9 uppercase">
            AI Career Planner
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#302c6b] text-white font-medium text-sm transition-colors">
            <LayoutDashboard className="w-4 h-4 text-indigo-400" /> Dashboard
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" /> Resume Upload
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
            <Target className="w-4 h-4" /> Career Matches
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
            <Puzzle className="w-4 h-4" /> Skill Gaps
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
            <Map className="w-4 h-4" /> Roadmap
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user?.fullName || "User Profile"}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner uppercase">
                {user?.firstName ? user.firstName[0] : "U"}
              </div>
            )}
            <div className="truncate">
              <div className="text-sm font-bold text-white truncate">
                {user?.fullName || "Verified User"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.primaryEmailAddress?.emailAddress || "No Email Provided"}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200/60 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, {user?.firstName || "User"}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {currentDate}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" /> Upload Resume
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Top Prediction Banner */}
          <div className="bg-[#4f46e5] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold uppercase tracking-wider font-mono">
                  <Sparkles className="w-4 h-4" /> AI Career Prediction
                </div>
                <h2 className="text-2xl font-bold">
                  What role are you targeting?
                </h2>
                <p className="text-sm text-indigo-100">
                  Type your desired position below or select a popular match
                  option.
                </p>
              </div>

              <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-left md:text-right backdrop-blur-sm min-w-[160px]">
                <div className="text-[9px] uppercase tracking-wider text-indigo-200 font-bold mb-0.5">
                  Current Target
                </div>
                <div className="text-sm font-bold truncate max-w-[180px]">
                  {targetRole.trim() ? targetRole : "None Specified"}
                </div>
              </div>
            </div>

            {/* Interactive Search Bar Area */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
              <div className="relative flex-1 group">
                <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-20" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Engineer, Product Manager..."
                  className="w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl py-3 pl-11 pr-10 text-sm font-medium shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                />
                {targetRole && (
                  <button
                    onClick={() => setTargetRole("")}
                    className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={handleAnalyzeRole}
                disabled={!targetRole.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-indigo-400/40 disabled:text-indigo-200 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg disabled:shadow-none transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                Analyze Match <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Interactive Suggestion Tags */}
            <div className="mt-4 flex items-center gap-2 flex-wrap relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200 mr-1">
                Suggestions:
              </span>
              {[
                "Frontend Engineer",
                "Full-Stack Developer",
                "Backend Engineer",
                "Data Scientist",
                "DevOps Engineer",
                "Machine Learning Engineer",
              ].map((tag) => {
                const isSelected =
                  targetRole.toLowerCase().trim() === tag.toLowerCase().trim();
                return (
                  <button
                    key={tag}
                    onClick={() => setTargetRole(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-white text-indigo-600 border-white font-bold shadow-sm scale-105"
                        : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 text-white font-medium"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-500">
                  ATS Score
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-slate-900 leading-none">
                  78
                  <span className="text-lg text-slate-400 font-medium">
                    /100
                  </span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 mb-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12 THIS WEEK
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-500">
                  Top Career Match
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 mb-0.5">
                  Frontend Engineer
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  91% confidence
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-500">
                  Skills Identified
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Puzzle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 leading-none mb-1">
                  24
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Technical skills
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-500">
                  Gaps Found
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 leading-none mb-1">
                  7
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Skills to learn
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-6">
                  Career Match Breakdown
                </h3>
                <div className="space-y-5">
                  {[
                    {
                      role: "Frontend Engineer",
                      val: 91,
                      color: "bg-indigo-600",
                    },
                    {
                      role: "Full-Stack Developer",
                      val: 84,
                      color: "bg-indigo-500",
                    },
                    {
                      role: "Backend Engineer",
                      val: 71,
                      color: "bg-indigo-400",
                    },
                    { role: "Data Engineer", val: 58, color: "bg-indigo-300" },
                    { role: "DevOps / Cloud", val: 43, color: "bg-indigo-200" },
                  ].map((match) => (
                    <div key={match.role}>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-slate-700">{match.role}</span>
                        <span className="text-slate-500 font-mono">
                          {match.val}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`${match.color} h-full rounded-full`}
                          style={{ width: `${match.val}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-900">
                    Top Skill Gaps Detected
                  </h3>
                  <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    View all 7 gaps
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                      Frontend
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium">
                        TypeScript
                      </span>
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium">
                        React Testing Library
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                      Backend
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium">
                        Kubernetes
                      </span>
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium">
                        GraphQL
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                      Cloud
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium">
                        AWS Certified Solutions Architect
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-6">
                  ATS Analysis
                </h3>
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-slate-100"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-indigo-600"
                        strokeWidth="3"
                        strokeDasharray="78, 100"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-900 leading-none">
                        78
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Score
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">
                      Strong keyword alignment
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-orange-100 bg-orange-50/50">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">
                      Missing: System Design experience
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50/50">
                    <PlusCircle className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">
                      Add quantified achievements
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-900">
                    Learning Roadmap
                  </h3>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Frontend Path
                  </span>
                </div>

                <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Phase 1
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      JavaScript Fundamentals
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-50 border-2 border-indigo-500 flex items-center justify-center">
                      <BookOpen className="w-2.5 h-2.5 text-indigo-500" />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Phase 2
                    </div>
                    <div className="text-sm font-bold text-slate-900 mb-2">
                      React & TypeScript
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-400 mb-1">
                      <span>In progress</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center">
                      <Lock className="w-2 h-2 text-slate-400" />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Phase 3
                    </div>
                    <div className="text-sm font-bold text-slate-400">
                      Testing & DevOps
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-5">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <div>
                      <div className="text-xs font-medium text-slate-700">
                        Resume analyzed against 3 job postings
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        2 hours ago
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                    <div>
                      <div className="text-xs font-medium text-slate-700">
                        New skill gap detected: Kubernetes
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Yesterday
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                    <div>
                      <div className="text-xs font-medium text-slate-700">
                        Roadmap Phase 1 completed!
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        3 days ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay Layer Injection */}
      <ResumeUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
