import React, { useState } from "react";
import {
  Sparkles,
  Search,
  X,
  Upload,
  Cpu,
  ChevronRight,
  Target,
  TrendingUp,
  LayoutDashboard,
  Puzzle,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Map,
  Edit2,
  Download,
} from "lucide-react";
import ATSGauge from "../components/ATSGauge";
import RoadmapCarousel from "../components/RoadmapCarousel";
import SkeletonCard from "../components/SkeletonCard";

export default function MainOverview({
  targetRole,
  setTargetRole,
  uploadedFile,
  handleFileUpload,
  isAnalyzing,
  handleAnalyzeRole,
  analysisResult,
  handleDownloadGaps,
  isParsing,
  parsedResume,
}) {
  // Helper to safely render values (arrays/objects) as strings
  const formatValue = (val) => {
    if (Array.isArray(val)) {
      return val
        .map((v) => (typeof v === "object" ? JSON.stringify(v) : v))
        .join(", ");
    }
    if (typeof val === "object" && val !== null) {
      return JSON.stringify(val);
    }
    return val;
  };

  const [showRaw, setShowRaw] = React.useState(false);

  return (
    <>
      {/* ── AI Career Prediction Banner ──── */}
      <div className="bg-[#4f46e5] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-64 h-full bg-linear-to-l from-white/10 to-transparent pointer-events-none" />
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
          <div className="relative flex-1 group min-w-62.5">
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
          <label className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm font-medium rounded-xl py-3 px-4 cursor-pointer transition-all flex items-center justify-between min-w-62.5">
            <span className="flex items-center gap-2 truncate">
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {uploadedFile ? uploadedFile.name : "Upload Resume (PDF/DOCX)"}
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
            disabled={!uploadedFile || isAnalyzing}
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

      {/* Metric cards removed – pending features */}

      {/* ── Main Two-Column Grid ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
              analysisResult?.careerPredictions?.length ? (
                <div className="space-y-5">
                  {analysisResult.careerPredictions?.map((match, i) => (
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
                    No career predictions available.
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                <Target className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">
                  Run analysis to see career predictions
                </p>
              </div>
            )}
          </div>

          {/* Skill Gap Analysis – pending */}
          {/* Skill Match Heatmap – pending */}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          {/* ATS Analysis – pending */}
          {/* Learning Roadmap Carousel – pending */}

          {/* Parsed Resume Preview */}
          {(isParsing || (analysisResult && analysisResult.parsedResume)) && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Parsed Resume
                </h3>
              </div>
              {isParsing ? (
                <SkeletonCard lines={5} height="h-3" />
              ) : (
                <div className="space-y-3 text-xs">
                  {[
                    { label: "Name", value: analysisResult.parsedResume.name },
                    {
                      label: "Email",
                      value: analysisResult.parsedResume.email,
                    },
                    {
                      label: "Education",
                      value: (() => {
                        const edu = analysisResult.parsedResume.education;
                        if (Array.isArray(edu)) {
                          return edu.map((e, i) => (
                            <p
                              key={i}
                              className="text-slate-700 font-medium mt-0.5 whitespace-pre-wrap"
                            >
                              {e.raw}
                            </p>
                          ));
                        }
                        return (
                          <p className="text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">
                            {edu?.raw ?? formatValue(edu)}
                          </p>
                        );
                      })(),
                    },
                    {
                      label: "Experience",
                      value: (() => {
                        const exp = analysisResult.parsedResume.experience;
                        if (Array.isArray(exp)) {
                          return exp.map((e, i) => (
                            <div key={i} className="space-y-1">
                              <p className="text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">
                                {e.raw}
                              </p>
                              {e.companies?.length > 0 && (
                                <p className="text-slate-500 text-xs">
                                  Companies: {e.companies.join(", ")}
                                </p>
                              )}
                              {e.role && (
                                <p className="text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">
                                  {e.role}
                                </p>
                              )}
                              {e.company && (
                                <p className="text-slate-600 italic">
                                  {e.company}
                                </p>
                              )}
                              {e.highlights?.length > 0 && (
                                <ul className="list-disc ml-3 space-y-0.5">
                                  {e.highlights.map((h, hi) => (
                                    <li key={hi}>{h}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ));
                        }
                        return (
                          <p className="text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">
                            {exp?.raw ?? formatValue(exp)}
                          </p>
                        );
                      })(),
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                        {label}
                      </span>
                      {label === "Email" ? (
                        value ? (
                          <p className="text-slate-700 font-medium mt-0.5">
                            {value}
                          </p>
                        ) : (
                          <p className="text-slate-500 italic mt-0.5">
                            (email not detected)
                          </p>
                        )
                      ) : (
                        <div className="space-y-1">{value}</div>
                      )}
                      {label === "Experience" && (
                        <>
                          <button
                            onClick={() => setShowRaw(!showRaw)}
                            className="mt-2 text-sm text-indigo-600 hover:underline"
                          >
                            {showRaw ? "Hide" : "Show"} Raw JSON
                          </button>
                          {showRaw && (
                            <pre
                              className="mt-2 bg-slate-50 p-2 rounded text-[10px]"
                              style={{ maxHeight: "200px", overflow: "auto" }}
                            >
                              {JSON.stringify(analysisResult, null, 2)}
                            </pre>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {analysisResult.parsedResume.skills.map((s) => (
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
    </>
  );
}
