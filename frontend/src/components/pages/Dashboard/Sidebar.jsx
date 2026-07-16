import React, { useState } from "react";
import appLogo from "../../../assets/Career Compass Logo.png";
import ProfileView from "./views/ProfileView";
import FeedbackModal from "../../modals/FeedbackModal";
import {
  Sparkles,
  ArrowLeft,
  Settings,
  LogOut,
  Camera,
  Check,
  Edit2,
  User,
  Shield,
  Globe,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Menu,
} from "lucide-react";

export default function Sidebar({
  navCollapsed,
  setNavCollapsed,
  showSidebarProfile,
  setShowSidebarProfile,
  activeSection,
  setActiveSection,
  user,
  isEditingProfile,
  setIsEditingProfile,
  profilePhoto,
  handleProfilePhotoChange,
  profileBio,
  setProfileBio,
  handleSignOut,
  navItems,
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  return (
    <aside
      className={`relative overflow-hidden h-full shrink-0 transition-all duration-300 ease-in-out ${
        navCollapsed && !showSidebarProfile ? "w-20" : "w-64"
      }`}
    >
      {/* ── PANEL 1: Logo + Navigation ── */}
      <div
        className={`absolute inset-0 flex flex-col bg-[#1e1a4f] transition-transform duration-300 ease-in-out ${
          showSidebarProfile
            ? "-translate-y-full pointer-events-none"
            : "translate-y-0"
        }`}
      >
        <div
          className={`h-20 flex items-center border-b border-white/5 shrink-0 ${
            navCollapsed ? "justify-center" : "justify-between px-4"
          }`}
        >
          {!navCollapsed && (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img
                    src={appLogo}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xl font-bold text-white tracking-tight truncate">
                    CareerCompass
                  </span>
                  <span className="text-[9px] font-mono text-indigo-300/80 tracking-[0.2em] uppercase truncate">
                    AI Career Planner
                  </span>
                </div>
              </div>
              <button
                onClick={() => setNavCollapsed(true)}
                className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1 shrink-0"
                title="Collapse sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          )}
          {navCollapsed && (
            <button
              onClick={() => setNavCollapsed(false)}
              className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform hover:scale-105"
              title="Expand sidebar"
            >
              <img
                src={appLogo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon, action }) => (
            <button
              key={id}
              onClick={() => {
                action ? action() : setActiveSection(id);
              }}
              title={navCollapsed ? label : undefined}
              className={`w-full flex items-center rounded-lg font-medium text-sm transition-colors ${
                navCollapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
              } ${
                activeSection === id
                  ? "bg-[#302c6b] text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${activeSection === id ? "text-indigo-400" : ""}`}
              />
              {!navCollapsed && label}
            </button>
          ))}
        </nav>

        <div
          onClick={() => setShowSidebarProfile(true)}
          className={`p-4 border-t border-white/5 flex items-center cursor-pointer hover:bg-white/5 transition-all ${
            navCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner uppercase overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.firstName[0]
              )}
            </div>
            {!navCollapsed && (
              <div className="truncate">
                <div className="text-sm font-bold text-white truncate">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user.primaryEmailAddress.emailAddress}
                </div>
              </div>
            )}
          </div>
          {!navCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSignOut();
              }}
              className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── PANEL 2: Profile Info ── */}
      <ProfileView
        showSidebarProfile={showSidebarProfile}
        setShowSidebarProfile={setShowSidebarProfile}
        setActiveSection={setActiveSection}
        user={user}
        isEditingProfile={isEditingProfile}
        setIsEditingProfile={setIsEditingProfile}
        profilePhoto={profilePhoto}
        handleProfilePhotoChange={handleProfilePhotoChange}
        profileBio={profileBio}
        setProfileBio={setProfileBio}
        handleSignOut={handleSignOut}
        setFeedbackOpen={setFeedbackOpen}
      />

      {/* ── Modals ── */}
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </aside>
  );
}
