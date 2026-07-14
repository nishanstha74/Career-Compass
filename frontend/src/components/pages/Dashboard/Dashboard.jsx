import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Bell, LayoutDashboard, Target, Puzzle, Map } from "lucide-react";

import Sidebar from "./Sidebar";
import MainOverview from "./views/MainOverview";
import CareerMatches from "./views/CareerMatches";
import SkillGaps from "./views/SkillGaps";
import RoadmapView from "./views/RoadmapView";
import SettingsView from "./views/SettingsView";

// MOCK DATA
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

export default function Dashboard() {
  const navigate = useNavigate();

  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResume, setParsedResume] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showRegistrationBanner, setShowRegistrationBanner] = useState(false);
  const [showSidebarProfile, setShowSidebarProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileBio, setProfileBio] = useState("Aspiring Frontend Developer");
  const [darkMode, setDarkMode] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

  const storedName = localStorage.getItem("userName") || "User";
  const storedEmail = localStorage.getItem("userEmail") || "No Email Provided";
  const firstName = storedName.split(" ")[0];

  useEffect(() => {
    const registrationFlag = localStorage.getItem("isNewRegistration");
    if (registrationFlag === "true") {
      setShowRegistrationBanner(true);
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

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePhoto(reader.result);
    reader.readAsDataURL(file);
  };

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
  ];

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-colors ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"
      }`}
    >
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Sidebar
        navCollapsed={navCollapsed}
        setNavCollapsed={setNavCollapsed}
        showSidebarProfile={showSidebarProfile}
        setShowSidebarProfile={setShowSidebarProfile}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        isEditingProfile={isEditingProfile}
        setIsEditingProfile={setIsEditingProfile}
        profilePhoto={profilePhoto}
        handleProfilePhotoChange={handleProfilePhotoChange}
        profileBio={profileBio}
        setProfileBio={setProfileBio}
        handleSignOut={handleSignOut}
        navItems={navItems}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header
          className={`h-20 px-8 flex items-center justify-between border-b shrink-0 transition-colors ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200/60"
          }`}
        >
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

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {activeSection === "dashboard" && (
            <MainOverview
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              uploadedFile={uploadedFile}
              handleFileUpload={handleFileUpload}
              isAnalyzing={isAnalyzing}
              handleAnalyzeRole={handleAnalyzeRole}
              analysisResult={analysisResult}
              handleDownloadGaps={handleDownloadGaps}
              isParsing={isParsing}
              parsedResume={parsedResume}
            />
          )}

          {activeSection === "careers" && (
            <CareerMatches setActiveSection={setActiveSection} />
          )}

          {activeSection === "skills" && (
            <SkillGaps setActiveSection={setActiveSection} />
          )}

          {activeSection === "roadmap" && (
            <RoadmapView setActiveSection={setActiveSection} />
          )}

          {activeSection === "settings" && (
            <SettingsView
              storedName={storedName}
              targetRole={targetRole}
              parsedResume={parsedResume}
              storedEmail={storedEmail}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          )}
        </div>
      </main>
    </div>
  );
}
