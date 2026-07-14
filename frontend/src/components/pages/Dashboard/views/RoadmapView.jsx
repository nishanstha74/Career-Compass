import React from "react";

export default function RoadmapView({ setActiveSection }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200/60 text-center py-16 shadow-sm">
      <div className="max-w-sm mx-auto space-y-3">
        <h3 className="text-base font-bold text-slate-900">Roadmap Central</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please run an AI Match analysis on the main Dashboard view tab to
          populate interactive tracking analytics for this section.
        </p>
        <button
          onClick={() => setActiveSection("dashboard")}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          ← Go back to Dashboard
        </button>
      </div>
    </div>
  );
}
