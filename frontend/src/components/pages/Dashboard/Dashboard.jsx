import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Bell, LayoutDashboard, Target, Puzzle, Map } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

import Sidebar from "./Sidebar";
import MainOverview from "./views/MainOverview";
import CareerMatches from "./views/CareerMatches";
import SkillGaps from "./views/SkillGaps";
import RoadmapView from "./views/RoadmapView";
import SettingsView from "./views/SettingsView";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, checkAuth } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [targetRole, setTargetRole] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResume, setParsedResume] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [showRegistrationBanner, setShowRegistrationBanner] = useState(false);
  const [showSidebarProfile, setShowSidebarProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(
    authUser?.profilePhoto || null,
  );
  const [profileBio, setProfileBio] = useState("Aspiring Frontend Developer");
  const [darkMode, setDarkMode] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

  const storedName =
    authUser?.fullName || localStorage.getItem("userName") || "User";
  const storedEmail =
    authUser?.email || localStorage.getItem("userEmail") || "No Email Provided";
  const firstName = storedName.split(" ")[0];

  useEffect(() => {
    if (authUser?.profilePhoto) {
      setProfilePhoto(authUser.profilePhoto);
    }
  }, [authUser?.profilePhoto]);

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
    imageUrl: authUser?.profilePhoto || null,
    primaryEmailAddress: { emailAddress: storedEmail },
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSignOut = async () => {
    console.log("Signing out safely...");
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    }

    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isNewRegistration");

    await checkAuth(); // update global context (will set user to null)
    navigate("/");
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please choose an image under 2MB to ensure fast loading.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result;
      setProfilePhoto(base64Str); // Optimistic UI update

      const toastId = toast.loading("Saving profile picture...");
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/profile-photo",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ profilePhoto: base64Str }),
          },
        );
        const data = await response.json();

        if (data.success) {
          toast.success("Profile picture saved!", { id: toastId });
          await checkAuth(); // update context
        } else {
          toast.error(data.message || "Failed to save picture", {
            id: toastId,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error while saving", { id: toastId });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setIsParsing(true);
    toast.loading("Parsing resume…", { id: "parse" });

    try {
      // Removed mock parsing. Real parsing will be handled after analysis.
      setParsedResume(null);
      toast.success("Resume parsed successfully!", { id: "parse" });
    } catch {
      toast.error("Failed to parse resume. Try again.", { id: "parse" });
    } finally {
      setIsParsing(false);
    }
  };

  const handleAnalyzeRole = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a resume before analysis");
      return;
    }
    setIsAnalyzing(true);
    toast.loading("Running AI analysis…", { id: "analyze" });

    try {
      // Build FormData for file upload (append text fields before file binary for Multer parsing)
      const formData = new FormData();
      if (targetRole) {
        formData.append("target_role", targetRole);
      }
      formData.append("file", uploadedFile);

      const response = await fetch("http://localhost:8000/api/ml/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Analysis failed. Please try a different resume file.",
        );
      }

      setAnalysisResult(data);
      setParsedResume(data.parsedResume);
      toast.success("Analysis complete!", { id: "analyze" });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Analysis failed. Please try again.", {
        id: "analyze",
      });
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
      {/* ATS Analysis removed – pending */}
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
          {/* Skill Match Heatmap removed – pending */}
          <div>
            <h1
              className={`text-xl font-bold transition-colors duration-200 ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Welcome back, {user.firstName}
            </h1>
            <p
              className={`text-xs font-mono mt-0.5 transition-colors duration-200 ${
                darkMode ? "text-slate-400" : "text-slate-400"
              }`}
            >
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
          {/* Metric cards removed – pending features */}
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
            <CareerMatches
              analysisResult={analysisResult}
              setActiveSection={setActiveSection}
              setTargetRole={setTargetRole}
            />
          )}

          {activeSection === "skills" && (
            <SkillGaps
              analysisResult={analysisResult}
              targetRole={targetRole}
              handleDownloadGaps={handleDownloadGaps}
              setActiveSection={setActiveSection}
            />
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
