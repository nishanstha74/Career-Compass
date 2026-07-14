import React from "react";
import { Mail, Moon, Sun } from "lucide-react";

export default function SettingsView({
  storedName,
  targetRole,
  parsedResume,
  storedEmail,
  darkMode,
  setDarkMode,
}) {
  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Dynamic Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl border border-blue-100 uppercase shadow-sm">
            {storedName
              ? storedName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "U"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {storedName || "User Profile"}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {targetRole || parsedResume?.experience || "Professional Account"}
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm">
          Edit Profile
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dynamic Contact Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-700 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
            Contact Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-slate-600 text-xs">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate font-semibold text-slate-800">
                {storedEmail || "No email available"}
              </span>
            </div>
            {parsedResume?.education && (
              <div className="flex items-center space-x-3 text-slate-600 text-xs">
                <span className="text-slate-400 font-medium">Education:</span>
                <span className="truncate font-semibold text-slate-800">
                  {parsedResume.education}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Skills Inventory from Parsed Resume */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-700 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
            Skills Inventory
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {parsedResume?.skills && parsedResume.skills.length > 0 ? (
              parsedResume.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md border border-blue-100"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs font-medium text-slate-400 italic">
                Upload your resume on the dashboard tab to dynamically populate
                your system skills.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-700 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
          App Preferences
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              {darkMode ? (
                <Moon className="w-4 h-4 text-blue-600" />
              ) : (
                <Sun className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                Dark Mode
              </div>
              <div className="text-xs text-slate-400">
                Switch the dashboard between light and dark appearance
              </div>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
              darkMode ? "bg-blue-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                darkMode ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
