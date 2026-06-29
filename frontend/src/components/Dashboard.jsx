import React, { useState } from "react";
import appLogo from "../assets/Career Compass Logo.png";
import { useClerk, useUser } from "@clerk/clerk-react"; // 1. Import useUser along with useClerk
import {
  FileText,
  Compass,
  CheckCircle,
  TrendingUp,
  Map,
  LogOut,
  User,
  Upload,
  FileCheck,
  Loader2,
  BrainCircuit,
  Award,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Milestone,
} from "lucide-react";

export default function Dashboard() {
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser(); // 2. Grab live authentication state and user details

  const [activeTab, setActiveTab] = useState("upload");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [file, setFile] = useState(null);

  const menuItems = [
    { id: "upload", name: "Upload Resume", icon: FileText },
    { id: "prediction", name: "Career Outlook", icon: Compass },
    { id: "ats", name: "ATS Matcher", icon: CheckCircle },
    { id: "skills", name: "Skill Gap Analysis", icon: TrendingUp },
    { id: "roadmap", name: "AI Study Path", icon: Map },
  ];

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    setUploadLoading(true);
    setTimeout(() => {
      setUploadLoading(false);
      setActiveTab("prediction");
    }, 2000);
  };

  // 3. Fallback loader until Clerk completely resolves user data to prevent undefined errors
  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm font-medium text-slate-500">
          Loading your profile session...
        </p>
      </div>
    );
  }

  // Fallback data structure if somehow accessed while signed out
  const userDisplayName = user?.fullName || user?.firstName || "Student User";
  const userEmailAddress =
    user?.primaryEmailAddress?.emailAddress || "student@ncit.edu.np";
  const userProfileImageUrl = user?.imageUrl;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div
              className="flex items-center cursor-pointer h-10 px-2 mb-8"
              onClick={() => navigate("/")}
            ></div>
            <div className="w-16 h-16 mb-2 flex items-center justify-center">
              <img
                src={appLogo}
                alt="CareerCompass Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">CareerCompass</h1>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* PROFILE DESIGNATED BOUNDARY */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {/* 4. Display live Google account avatar if available, otherwise fallback to standard avatar */}
            {userProfileImageUrl ? (
              <img
                src={userProfileImageUrl}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}

            {/* 5. Dynamically binding the user's real name and email address details */}
            <div className="truncate w-32">
              <p
                className="text-xs font-bold truncate text-slate-800"
                title={userDisplayName}
              >
                {userDisplayName}
              </p>
              <p
                className="text-[10px] text-slate-400 truncate font-medium"
                title={userEmailAddress}
              >
                {userEmailAddress}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-1.5 rounded-lg shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <h2 className="font-bold text-xl text-slate-800 capitalize">
            {menuItems.find((m) => m.id === activeTab)?.name}
          </h2>
          <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-semibold border border-slate-200">
            System Mode: Template View
          </div>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto">
          {activeTab === "upload" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto shadow-sm text-center">
              <h3 className="font-bold text-lg mb-2">Analyze Your Resume</h3>
              <p className="text-sm text-slate-400 mb-6">
                Upload your profile in PDF format for intelligent career
                predictions.
              </p>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {file ? (
                    <>
                      <FileCheck className="w-12 h-12 text-emerald-500 mb-3" />
                      <p className="text-sm font-bold text-slate-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-blue-500 mb-3" />
                      <p className="text-sm font-bold text-slate-600">
                        Drag and drop your PDF here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports standard PDF formats up to 5MB
                      </p>
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!file || uploadLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm shadow-blue-100"
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing With spaCy NLP Engine...</span>
                    </>
                  ) : (
                    <span>Analyze Resume</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === "prediction" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex items-center space-x-4 shadow-md">
                <BrainCircuit className="w-12 h-12 text-blue-100/80 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">
                    XGBoost Career Engine Output
                  </h3>
                  <p className="text-sm text-blue-100/80">
                    Probabilistic classification scoring across matching tech
                    career domains.
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    role: "Machine Learning Engineer",
                    percentage: 94,
                    category: "AI & Data Science",
                  },
                  {
                    role: "Full Stack Developer",
                    percentage: 78,
                    category: "Software Engineering",
                  },
                  {
                    role: "Data Analyst",
                    percentage: 62,
                    category: "AI & Data Science",
                  },
                ].map((p, idx) => (
                  <div
                    key={p.role}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        {idx === 0 && (
                          <Award className="w-4 h-4 text-amber-500" />
                        )}
                        {p.role}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-4 w-1/2 justify-end">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${idx === 0 ? "bg-emerald-500" : "bg-blue-500"}`}
                          style={{ width: `${p.percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-sm text-slate-700 min-w-[45px] text-right">
                        {p.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ats" && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="relative flex items-center justify-center mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#1e40af"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - 74 / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-mono font-bold text-2xl text-slate-800">
                    74%
                  </span>
                </div>
                <h4 className="font-bold text-base mb-1">ATS Match Rating</h4>
                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                  Good Match
                </span>
              </div>
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Semantic Similarity Report
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Your technical background demonstrates high alignment with
                    standard industry criteria. To bridge the remaining variance
                    gap, optimize missing industry keywords listed in the next
                    panel.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium block">
                      Extracted Skills
                    </span>
                    <span className="text-lg font-mono font-bold text-slate-700">
                      14 Found
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium block">
                      Job Benchmarks
                    </span>
                    <span className="text-lg font-mono font-bold text-slate-700">
                      18 Required
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Extracted Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "React.js",
                    "Node.js",
                    "Python",
                    "MySQL",
                    "Tailwind CSS",
                  ].map((sk) => (
                    <span
                      key={sk}
                      className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-100"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Identified Skill Gaps
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "XGBoost Tuning",
                    "Docker Containers",
                    "REST Optimization",
                  ].map((sk) => (
                    <span
                      key={sk}
                      className="bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-100"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white flex items-center space-x-4 shadow-md">
                <Sparkles className="w-12 h-12 text-purple-100/80 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">
                    AI Generated Learning Roadmap
                  </h3>
                  <p className="text-sm text-purple-100/80">
                    Tailored study paths pulled natively via the Gemini API to
                    bridge your skills gaps.
                  </p>
                </div>
              </div>
              <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                {[
                  {
                    step: "Phase 1",
                    topic: "Advanced Ensemble Frameworks",
                    resource:
                      "Scikit-Learn documentation & XGBoost API tutorials",
                  },
                  {
                    step: "Phase 2",
                    topic: "Containerization Mechanics",
                    resource: "Docker Core Essentials Course",
                  },
                  {
                    step: "Phase 3",
                    topic: "Microservice Architecture API Routing",
                    resource: "Node.js cluster orchestration design modules",
                  },
                ].map((node) => (
                  <div
                    key={node.step}
                    className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="absolute -left-[35px] top-5 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                      <Milestone className="w-3 h-3" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-purple-600 uppercase">
                        {node.step}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base">
                        {node.topic}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 font-medium">
                        Recommended Reference: {node.resource}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
