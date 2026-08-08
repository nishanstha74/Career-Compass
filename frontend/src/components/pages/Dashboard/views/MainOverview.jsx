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
  Puzzle,
  CheckCircle2,
  AlertCircle,
  Award,
  Layers,
  FileCheck,
} from "lucide-react";
import ATSGauge from "../components/ATSGauge";
import SkeletonCard from "../components/SkeletonCard";

export default function MainOverview({
  targetRole,
  setTargetRole,
  uploadedFile,
  handleFileUpload,
  isAnalyzing,
  handleAnalyzeRole,
  analysisResult,
}) {
  const ats = analysisResult?.atsAnalysis;
  const sectionScores = ats?.section_scores || {
    skills: ats?.scoreBreakdown?.skillMatch || 70,
    experience: ats?.scoreBreakdown?.experienceScore || 80,
    education: ats?.scoreBreakdown?.educationScore || 90,
    projects: 75,
    domain: 80,
  };

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
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter target job role (e.g. Backend Developer)..."
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white text-slate-900 text-sm rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-xs border-0 font-medium"
            />
            {targetRole && (
              <button
                onClick={() => setTargetRole("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Resume Upload Button */}
          <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-xl text-sm font-semibold cursor-pointer border border-white/20 transition-all shadow-xs shrink-0 select-none">
            <Upload className="w-4 h-4" />
            <span>
              {uploadedFile ? uploadedFile.name : "Upload Resume"}
            </span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
          </label>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeRole}
            disabled={isAnalyzing || !uploadedFile}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Match</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Grid ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Career Match Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center justify-between">
              <span>Career Match Breakdown</span>
              {analysisResult?.careerPredictions?.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  {analysisResult.careerPredictions.length} Predictions Evaluated
                </span>
              )}
            </h3>

            {isAnalyzing ? (
              <SkeletonCard lines={5} height="h-5" />
            ) : analysisResult ? (
              analysisResult?.careerPredictions?.length ? (
                <div className="space-y-5">
                  {analysisResult.careerPredictions?.map((match, i) => (
                    <div key={match.role}>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-slate-700 flex items-center gap-2 font-semibold">
                          <span className="text-xs font-bold text-slate-400">
                            #{i + 1}
                          </span>
                          {match.role}
                        </span>
                        <span className="text-slate-700 font-mono font-bold">
                          {match.confidence}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className={`${match.color || "bg-indigo-600"} h-full rounded-full bar-fill`}
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

          {/* Skill Gap Analysis */}
          {ats && ats.user_provided_target && !isAnalyzing && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-indigo-600" /> Skill Gap Analysis
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  Target: {ats.targetRole || ats.matchedRoleName}
                </span>
              </div>

              {/* Matched Skills */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Matched Skills ({ats.matchedSkills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ats.matchedSkills?.length ? (
                    ats.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No skills matched target benchmark
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Skill Gaps */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Missing Skill Gaps ({ats.missingSkills?.length || 0})
                </span>
                <div className="space-y-3">
                  {ats.skillGaps?.length ? (
                    ats.skillGaps.map((gapItem) => (
                      <div key={gapItem.skill} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-800 font-semibold">
                            {gapItem.skill}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {gapItem.category}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full bar-fill"
                            style={{ width: `${gapItem.gap}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium">
                      🎉 Great job! No critical skill gaps detected for this role.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          {/* 5-Dimension ATS Compatibility Score & Section Breakdown */}
          {ats && ats.user_provided_target && !isAnalyzing && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" /> ATS Score Engine
                </h3>
              </div>

              {/* Circular SVG Gauge */}
              <ATSGauge score={ats.atsScore} />

              {/* 5-Dimension Section Breakdown */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  5-Dimension Evaluation Breakdown
                </span>

                {[
                  { label: "Skill Match (35%)", score: sectionScores.skills, color: "bg-indigo-600" },
                  { label: "Experience & Responsibilities (30%)", score: sectionScores.experience, color: "bg-blue-600" },
                  { label: "Education & Credentials (15%)", score: sectionScores.education, color: "bg-emerald-600" },
                  { label: "Projects & Applications (10%)", score: sectionScores.projects, color: "bg-purple-600" },
                  { label: "Domain & Industry Fit (10%)", score: sectionScores.domain, color: "bg-amber-600" },
                ].map((sec) => (
                  <div key={sec.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-semibold">{sec.label}</span>
                      <span className="text-slate-900 font-mono font-bold">{sec.score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${sec.color} h-full rounded-full bar-fill`}
                        style={{ width: `${sec.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Strengths & Critical Gaps Cards */}
          {ats && ats.user_provided_target && !isAnalyzing && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover space-y-4 text-xs">
              {ats.key_strengths?.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-emerald-700">
                    <Award className="w-4 h-4 text-emerald-600" /> Key Strengths
                  </span>
                  <ul className="space-y-1.5 text-slate-600 pl-2">
                    {ats.key_strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ats.recommendations?.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-indigo-700">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Actionable Recommendations
                  </span>
                  <ul className="space-y-1.5 text-slate-600 pl-2">
                    {ats.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
