import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import appLogo from "../../assets/Career Compass Logo.png";
import {
  LayoutDashboard,
  Sparkles,
  ArrowLeft,
  Target,
  Puzzle,
  Map,
  Settings,
  LogOut,
  Search,
  Bell,
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BookOpen,
  Lock,
  Download,
  ExternalLink,
  Cpu,
  Edit2,
} from "lucide-react";

// ─────────────────────────────────────────────
// MOCK DATA  ← swap these with real API responses
// ─────────────────────────────────────────────
const MOCK_RESULT = {
  parsedResume: {
    name: "Nishan Shrestha",
    email: "nishanshresths45@gmail.com",
    skills: ["React", "Node.js", "JavaScript", "MongoDB", "CSS", "Git"],
    education: "BESE – Pokhara University",
    experience: "1 year – Frontend Developer Intern",
  },
  atsScore: 78,
  atsBreakdown: [
    { label: "Strong keyword alignment", type: "success" },
    { label: "Missing: System Design experience", type: "warning" },
    { label: "Add quantified achievements", type: "info" },
  ],
  skillMatchHeatmap: [
    { skill: "React", present: true },
    { skill: "TypeScript", present: false },
    { skill: "Node.js", present: true },
    { skill: "GraphQL", present: false },
    { skill: "Docker", present: false },
    { skill: "JavaScript", present: true },
    { skill: "Testing Library", present: false },
    { skill: "AWS", present: false },
  ],
  careerPredictions: [
    { role: "Frontend Engineer", confidence: 91, color: "bg-indigo-600" },
    { role: "Full-Stack Developer", confidence: 84, color: "bg-indigo-500" },
    { role: "Backend Engineer", confidence: 71, color: "bg-indigo-400" },
    { role: "Data Engineer", confidence: 58, color: "bg-indigo-300" },
    { role: "DevOps / Cloud", confidence: 43, color: "bg-indigo-200" },
  ],
  skillGaps: [
    { skill: "TypeScript", gap: 80, category: "Frontend" },
    { skill: "React Testing", gap: 65, category: "Frontend" },
    { skill: "GraphQL", gap: 70, category: "Backend" },
    { skill: "Kubernetes", gap: 55, category: "Backend" },
    { skill: "AWS", gap: 60, category: "Cloud" },
    { skill: "Docker", gap: 50, category: "DevOps" },
    { skill: "System Design", gap: 75, category: "General" },
  ],
  roadmap: [
    {
      phase: "Phase 1",
      title: "TypeScript Mastery",
      description:
        "Complete TypeScript fundamentals and advanced types to strengthen frontend development.",
      resources: [
        {
          label: "Coursera – TypeScript Course",
          url: "https://www.coursera.org/learn/typescript",
        },
        {
          label: "Official TS Docs",
          url: "https://www.typescriptlang.org/docs/",
        },
      ],
      status: "pending",
    },
    {
      phase: "Phase 2",
      title: "React Testing Library",
      description:
        "Learn unit and integration testing with Jest and React Testing Library.",
      resources: [
        {
          label: "Udemy – React Testing",
          url: "https://www.udemy.com/topic/react-testing-library/",
        },
        {
          label: "GitHub – RTL Examples",
          url: "https://github.com/testing-library/react-testing-library",
        },
      ],
      status: "pending",
    },
    {
      phase: "Phase 3",
      title: "GraphQL & API Design",
      description:
        "Build and consume GraphQL APIs. Understand resolvers, mutations, and subscriptions.",
      resources: [
        { label: "GraphQL Official Docs", url: "https://graphql.org/learn/" },
        {
          label: "Udemy – GraphQL Bootcamp",
          url: "https://www.udemy.com/course/graphql-bootcamp/",
        },
      ],
      status: "locked",
    },
    {
      phase: "Phase 4",
      title: "Docker & Kubernetes",
      description:
        "Containerise applications with Docker and orchestrate them with Kubernetes.",
      resources: [
        { label: "Docker Docs", url: "https://docs.docker.com/get-started/" },
        {
          label: "Coursera – K8s Basics",
          url: "https://www.coursera.org/learn/google-kubernetes-engine",
        },
      ],
      status: "locked",
    },
  ],
};

// ─────────────────────────────────────────────
// SKELETON LOADER COMPONENT
// ─────────────────────────────────────────────
function SkeletonCard({ lines = 3, height = "h-4" }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${height} ${i === 0 ? "w-2/3" : i % 2 === 0 ? "w-full" : "w-4/5"}`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ATS GAUGE COMPONENT
// ─────────────────────────────────────────────
function ATSGauge({ score }) {
  const color =
    score >= 76
      ? "text-indigo-600"
      : score >= 51
        ? "text-amber-500"
        : "text-red-500";
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-slate-100"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className={`${color} gauge-arc`}
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900 leading-none">
          {score}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          / 100
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROADMAP CAROUSEL COMPONENT
// ─────────────────────────────────────────────
function RoadmapCarousel({ steps }) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];

  return (
    <div>
      <div className="fade-in" key={current}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
            {step.phase}
          </span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
              step.status === "pending"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {step.status === "locked" ? "🔒 Locked" : "Upcoming"}
          </span>
        </div>
        <div className="text-sm font-bold text-slate-900 mb-1">
          {step.title}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          {step.description}
        </p>
        <div className="space-y-1.5">
          {step.resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {r.label}
            </a>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => setCurrent((p) => Math.max(0, p - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <span className="text-[10px] font-mono text-slate-400">
          {current + 1} / {steps.length}
        </span>
        <button
          onClick={() => setCurrent((p) => Math.min(steps.length - 1, p + 1))}
          disabled={current === steps.length - 1}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? "bg-indigo-600 w-3" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResume, setParsedResume] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  // 📢 State to check if this is a fresh registration redirect
  const [showRegistrationBanner, setShowRegistrationBanner] = useState(false);

  const storedName = localStorage.getItem("userName") || "User";
  const storedEmail = localStorage.getItem("userEmail") || "No Email Provided";
  const firstName = storedName.split(" ")[0];

  // Check flag on mount to determine if we show the success alert
  useEffect(() => {
    const registrationFlag = localStorage.getItem("isNewRegistration");
    if (registrationFlag === "true") {
      setShowRegistrationBanner(true);
      // Clean it from memory immediately so it won't persist on page reloads
      localStorage.removeItem("isNewRegistration");
    }
  }, []);

  const user = {
    firstName: firstName,
    fullName: storedName,
    imageUrl: null,
    primaryEmailAddress: { emailAddress: storedEmail },
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSignOut = () => {
    console.log("Signing out safely...");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isNewRegistration");
    navigate("/");
  };

  // ── Resume Upload Handler ──────────────────
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setIsParsing(true);
    toast.loading("Parsing resume…", { id: "parse" });

    try {
      await new Promise((r) => setTimeout(r, 1800));
      setParsedResume(MOCK_RESULT.parsedResume);
      toast.success("Resume parsed successfully!", { id: "parse" });
    } catch {
      toast.error("Failed to parse resume. Try again.", { id: "parse" });
    } finally {
      setIsParsing(false);
    }
  };

  // ── Analyze Match Handler ──────────────────
  const handleAnalyzeRole = async () => {
    if (!targetRole.trim() || !uploadedFile) return;
    setIsAnalyzing(true);
    toast.loading("Running AI analysis…", { id: "analyze" });

    try {
      await new Promise((r) => setTimeout(r, 1500));
      setAnalysisResult(MOCK_RESULT);
      toast.success("Analysis complete!", { id: "analyze" });
    } catch {
      toast.error("Analysis failed. Please try again.", { id: "analyze" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Download CSV of Skill Gaps ─────────────
  const handleDownloadGaps = () => {
    if (!analysisResult) return;
    const rows = [
      "Skill,Gap %,Category",
      ...analysisResult.skillGaps.map(
        (g) => `${g.skill},${g.gap},${g.category}`,
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skill_gaps.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "careers", label: "Career Matches", icon: Target },
    { id: "skills", label: "Skill Gaps", icon: Puzzle },
    { id: "roadmap", label: "Roadmap", icon: Map },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden text-slate-800">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* ══ SIDEBAR ══════════════════════════════ */}
      <aside className="w-64 bg-[#1e1a4f] flex flex-col h-full shrink-0">
        <div className="h-20 px-6 flex flex-col justify-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              CareerCompass
            </span>
          </div>
          <span className="text-[9px] font-mono text-indigo-300/80 tracking-[0.2em] mt-1 ml-9 uppercase">
            AI Career Planner
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon, action }) => (
            <button
              key={id}
              onClick={() => {
                action ? action() : setActiveSection(id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeSection === id
                  ? "bg-[#302c6b] text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${activeSection === id ? "text-indigo-400" : ""}`}
              />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner uppercase">
              {user.firstName[0]}
            </div>
            <div className="truncate">
              <div className="text-sm font-bold text-white truncate">
                {user.fullName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user.primaryEmailAddress.emailAddress}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ════════════════════════ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200/60 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, {user.firstName}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {currentDate}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <button
              className="text-slate-400 hover:text-slate-600 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* ── AI Career Prediction Banner ──── */}
          <div className="bg-[#4f46e5] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> AI Career Prediction
                </div>
                <h2 className="text-2xl font-bold">
                  Ready to analyze your career path?
                </h2>
                <p className="text-sm text-indigo-100">
                  Provide your target job role and upload your resume to begin.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-4 relative z-10">
              {/* Target Role Input */}
              <div className="relative flex-1 group min-w-[250px]">
                <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-20" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Target Role (e.g. Frontend Engineer)"
                  className="w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl py-3 pl-11 pr-10 text-sm font-medium shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-white transition-all"
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

              {/* Upload Resume Button */}
              <label className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm font-medium rounded-xl py-3 px-4 cursor-pointer transition-all flex items-center justify-between min-w-[250px]">
                <span className="flex items-center gap-2 truncate">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {uploadedFile
                      ? uploadedFile.name
                      : "Upload Resume (PDF/DOCX)"}
                  </span>
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeRole}
                disabled={!targetRole.trim() || !uploadedFile || isAnalyzing}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-indigo-400/40 disabled:text-indigo-200 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg disabled:shadow-none transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    Analyze Match <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Metric Cards ────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                label: "ATS Score",
                icon: Target,
                iconBg: "bg-indigo-50 text-indigo-600",
                value: isAnalyzing ? null : analysisResult ? (
                  <span className="text-3xl font-bold text-slate-900 leading-none">
                    {analysisResult.atsScore}
                    <span className="text-lg text-slate-400 font-medium">
                      /100
                    </span>
                  </span>
                ) : (
                  <span className="text-3xl font-bold text-slate-300">—</span>
                ),
                sub: analysisResult ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12 THIS WEEK
                  </span>
                ) : null,
              },
              {
                label: "Top Career Match",
                icon: LayoutDashboard,
                iconBg: "bg-blue-50 text-blue-600",
                value: isAnalyzing ? null : analysisResult ? (
                  <div>
                    <div className="text-xl font-bold text-slate-900 mb-0.5">
                      {analysisResult.careerPredictions[0].role}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {analysisResult.careerPredictions[0].confidence}%
                      confidence
                    </div>
                  </div>
                ) : (
                  <span className="text-xl font-bold text-slate-300">
                    Run analysis
                  </span>
                ),
              },
              {
                label: "Skills Identified",
                icon: Puzzle,
                iconBg: "bg-purple-50 text-purple-600",
                value: isAnalyzing ? null : analysisResult ? (
                  <span className="text-3xl font-bold text-slate-900 leading-none">
                    {analysisResult.parsedResume.skills.length}
                  </span>
                ) : (
                  <span className="text-3xl font-bold text-slate-300">—</span>
                ),
                sub: (
                  <div className="text-xs text-slate-400 font-medium">
                    Technical skills
                  </div>
                ),
              },
              {
                label: "Gaps Found",
                icon: Sparkles,
                iconBg: "bg-amber-50 text-amber-600",
                value: isAnalyzing ? null : analysisResult ? (
                  <span className="text-3xl font-bold text-slate-900 leading-none">
                    {analysisResult.skillGaps.length}
                  </span>
                ) : (
                  <span className="text-3xl font-bold text-slate-300">—</span>
                ),
                sub: (
                  <div className="text-xs text-slate-400 font-medium">
                    Skills to learn
                  </div>
                ),
              },
            ].map(({ label, icon: Icon, iconBg, value, sub }) => (
              <div
                key={label}
                className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between card-hover"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-500">
                    {label}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                {isAnalyzing ? (
                  <div className="space-y-2">
                    <div className="skeleton h-7 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ) : (
                  <div className="flex items-end gap-3">
                    {value}
                    {sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Main Two-Column Grid ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* Career Match Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
                <h3 className="text-base font-bold text-slate-900 mb-6">
                  Career Match Breakdown
                </h3>
                {isAnalyzing ? (
                  <SkeletonCard lines={5} height="h-5" />
                ) : analysisResult ? (
                  <div className="space-y-5">
                    {analysisResult.careerPredictions.map((match, i) => (
                      <div key={match.role}>
                        <div className="flex justify-between text-sm font-medium mb-2">
                          <span className="text-slate-700 flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                              #{i + 1}
                            </span>
                            {match.role}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {match.confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`${match.color} h-full rounded-full bar-fill`}
                            style={{ width: `${match.confidence}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <Target className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium">
                      Run analysis to see career predictions
                    </p>
                  </div>
                )}
              </div>

              {/* Skill Gap Analysis */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-900">
                    Skill Gap Analysis
                  </h3>
                  {analysisResult && (
                    <button
                      onClick={handleDownloadGaps}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download CSV
                    </button>
                  )}
                </div>
                {isAnalyzing ? (
                  <SkeletonCard lines={6} height="h-4" />
                ) : analysisResult ? (
                  <div className="space-y-4">
                    {analysisResult.skillGaps.map((gap) => (
                      <div key={gap.skill}>
                        <div className="flex justify-between text-xs font-medium mb-1.5">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            {gap.skill}
                            <span className="text-[9px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                              {gap.category}
                            </span>
                          </span>
                          <span className="text-slate-500 font-mono">
                            {gap.gap}% gap
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full bar-fill"
                            style={{ width: `${gap.gap}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <Puzzle className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium">
                      Run analysis to detect skill gaps
                    </p>
                  </div>
                )}
              </div>

              {/* Skill Match Heatmap */}
              {(isAnalyzing || analysisResult) && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
                  <h3 className="text-base font-bold text-slate-900 mb-4">
                    Skill Match Heatmap
                  </h3>
                  {isAnalyzing ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton h-7 w-20" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.skillMatchHeatmap.map((item) => (
                        <span
                          key={item.skill}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
                            item.present
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-600"
                          }`}
                        >
                          {item.present ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          {item.skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-1 space-y-6">
              {/* ATS Analysis */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
                <h3 className="text-base font-bold text-slate-900 mb-6">
                  ATS Analysis
                </h3>
                {isAnalyzing ? (
                  <SkeletonCard lines={4} height="h-5" />
                ) : analysisResult ? (
                  <>
                    <div className="mb-6">
                      <ATSGauge score={analysisResult.atsScore} />
                    </div>
                    <div className="space-y-2">
                      {analysisResult.atsBreakdown.map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            item.type === "success"
                              ? "border-slate-100 bg-slate-50/50"
                              : item.type === "warning"
                                ? "border-orange-100 bg-orange-50/50"
                                : "border-blue-100 bg-blue-50/50"
                          }`}
                        >
                          {item.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : item.type === "warning" ? (
                            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                          ) : (
                            <PlusCircle className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-700">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <Target className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium text-center">
                      ATS score appears after analysis
                    </p>
                  </div>
                )}
              </div>

              {/* Learning Roadmap Carousel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-slate-900">
                    Learning Roadmap
                  </h3>
                  {analysisResult && (
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {targetRole}
                    </span>
                  )}
                </div>
                {isAnalyzing ? (
                  <SkeletonCard lines={5} height="h-4" />
                ) : analysisResult ? (
                  <RoadmapCarousel steps={analysisResult.roadmap} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <Map className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium text-center">
                      Roadmap generated after analysis
                    </p>
                  </div>
                )}
              </div>

              {/* Parsed Resume Preview */}
              {(isParsing || parsedResume) && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-slate-900">
                      Parsed Resume
                    </h3>
                    {parsedResume && (
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isParsing ? (
                    <SkeletonCard lines={5} height="h-3" />
                  ) : (
                    <div className="space-y-3 text-xs">
                      {[
                        { label: "Name", value: parsedResume.name },
                        { label: "Email", value: parsedResume.email },
                        { label: "Education", value: parsedResume.education },
                        { label: "Experience", value: parsedResume.experience },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                            {label}
                          </span>
                          <p className="text-slate-700 font-medium mt-0.5">
                            {value}
                          </p>
                        </div>
                      ))}
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                          Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {parsedResume.skills.map((s) => (
                            <span
                              key={s}
                              className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
