import React from "react";
import {
  ArrowLeft,
  Settings,
  Camera,
  Check,
  Edit2,
  User,
  Shield,
  Globe,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  LogOut,
} from "lucide-react";

export default function ProfileView({
  showSidebarProfile,
  setShowSidebarProfile,
  setActiveSection,
  user,
  isEditingProfile,
  setIsEditingProfile,
  profilePhoto,
  handleProfilePhotoChange,
  profileBio,
  setProfileBio,
  handleSignOut,
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col bg-slate-50 transition-transform duration-300 ease-in-out ${
        showSidebarProfile
          ? "translate-y-0"
          : "translate-y-full pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="h-20 px-4 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={() => {
            setShowSidebarProfile(false);
            setIsEditingProfile(false);
          }}
          className="text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none p-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">Profile</span>
        <button
          onClick={() => {
            setActiveSection("settings");
            setShowSidebarProfile(false);
            setIsEditingProfile(false);
          }}
          className="text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none p-1"
          title="Go to Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-4 py-6 space-y-5">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover shadow-sm border-4 border-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm border-4 border-white uppercase">
                {user.firstName[0]}
              </div>
            )}
            <label
              htmlFor="profile-photo-upload"
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md hover:bg-indigo-700 transition-colors cursor-pointer border-2 border-white"
            >
              <Camera className="w-3 h-3" />
            </label>
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              className="hidden"
            />
          </div>
          <div className="text-sm font-bold text-slate-800 mt-3">
            {user.fullName}
          </div>
          {isEditingProfile ? (
            <input
              autoFocus
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingProfile(false);
              }}
              className="mt-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 text-center focus:outline-none focus:border-indigo-400 w-full max-w-[200px]"
            />
          ) : (
            <span className="text-xs text-slate-500 mt-1">{profileBio}</span>
          )}
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isEditingProfile ? (
            <Check className="w-4 h-4" />
          ) : (
            <Edit2 className="w-4 h-4" />
          )}
          {isEditingProfile ? "Save Profile" : "Edit Profile"}
        </button>

        {/* Menu Card */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
          {[
            { label: "Personal Info", icon: User },
            { label: "Account Privacy", icon: Shield },
            { label: "Preferences", icon: Globe },
            { label: "Feedback", icon: MessageSquare },
            { label: "Help & Support", icon: HelpCircle },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="flex-1 text-left">{label}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </div>

        {/* Logout Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
