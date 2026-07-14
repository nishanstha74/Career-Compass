import React from "react";
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
  return (
    <>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {[
          {
            label: "ATS Score",
            icon: Target,
            iconBg: "bg-indigo-50 text-indigo-600",
            value: isAnalyzing ? null : analysisResult ? (
              <span className="text-3xl font-bold text-slate-900 leading-none">
                {analysisResult.atsScore}
                <span className="text-lg text-slate-400 font-medium">/100</span>
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
                  {analysisResult.careerPredictions[0].confidence}% confidence
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
              <span className="text-xs font-bold text-slate-500">{label}</span>
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
                    {
                      label: "Education",
                      value: parsedResume.education,
                    },
                    {
                      label: "Experience",
                      value: parsedResume.experience,
                    },
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
    </>
  );
}
