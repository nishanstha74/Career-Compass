import React, { useState } from "react";
import {
  Puzzle,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowLeft,
  BookOpen,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function SkillGaps({
  analysisResult,
  targetRole,
  handleDownloadGaps,
  setActiveSection,
}) {
  const ats = analysisResult?.atsAnalysis;
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Study topics helper for missing skills
  const getStudyTopics = (skillName) => {
    const s = skillName.toLowerCase();
    if (
      s.includes("docker") ||
      s.includes("kubernetes") ||
      s.includes("container")
    ) {
      return [
        "Docker Architecture & Images",
        "Dockerfile & Multi-stage builds",
        "Docker Compose",
        "Kubernetes Pods & Deployments",
      ];
    } else if (
      s.includes("sql") ||
      s.includes("postgres") ||
      s.includes("mongo") ||
      s.includes("database")
    ) {
      return [
        "Relational Database Normalization",
        "Indexing & Execution Plans",
        "ACID Transactions",
        "NoSQL Data Modeling",
      ];
    } else if (s.includes("api") || s.includes("rest") || s.includes("grpc")) {
      return [
        "RESTful Constraints & Resource Design",
        "HTTP Status Codes & Headers",
        "gRPC Protobuf Schema",
        "API Authentication (JWT/OAuth2)",
      ];
    } else if (
      s.includes("python") ||
      s.includes("pytorch") ||
      s.includes("tensorflow") ||
      s.includes("machine learning")
    ) {
      return [
        "NumPy & Pandas Data Manipulation",
        "PyTorch/TensorFlow Tensors",
        "Supervised Learning Models",
        "Model Evaluation Metrics",
      ];
    } else if (
      s.includes("aws") ||
      s.includes("cloud") ||
      s.includes("gcp") ||
      s.includes("azure")
    ) {
      return [
        "Compute & Virtual Machines (EC2/GCE)",
        "Cloud Storage (S3/IAM)",
        "Serverless Functions",
        "VPC & Security Groups",
      ];
    } else if (
      s.includes("git") ||
      s.includes("ci/cd") ||
      s.includes("pipeline")
    ) {
      return [
        "Branching Strategies (Git Flow)",
        "GitHub Actions Pipelines",
        "Automated Testing Suites",
        "Continuous Deployment",
      ];
    } else if (
      s.includes("system design") ||
      s.includes("architecture") ||
      s.includes("microservices")
    ) {
      return [
        "Scalability & Load Balancing",
        "Caching Strategies (Redis/Memcached)",
        "Message Queues (Kafka/RabbitMQ)",
        "Database Sharding",
      ];
    } else {
      return [
        "Core Technical Concepts",
        "Practical Hands-on Projects",
        "Industry Best Practices",
        "Performance Optimization",
      ];
    }
  };

  if (!ats || !ats.user_provided_target) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200/60 text-center py-20 shadow-sm max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <Puzzle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          No Active Skill Gap Report
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Please enter a Target Job Role (e.g. <em>Backend Developer</em>) and
          click <strong>Analyze Match</strong> on the main Dashboard to generate
          your skill gap analytics.
        </p>
        <button
          onClick={() => setActiveSection("dashboard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Dashboard
        </button>
      </div>
    );
  }

  const categories = [
    "All",
    "Core Technical",
    "Frameworks & Tools",
    "Cloud & Infrastructure",
    "Methodology & Architecture",
  ];

  const filteredGaps =
    selectedCategory === "All"
      ? ats.skillGaps || []
      : (ats.skillGaps || []).filter((g) => g.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Puzzle className="w-4 h-4" /> Skill Gap Analytics Center
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Target Role: {ats.matchedRoleName || targetRole}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Identified missing technical skills and recommended study pathways
            to reach 100% role readiness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {handleDownloadGaps && (
            <button
              onClick={handleDownloadGaps}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV Report
            </button>
          )}

          <button
            onClick={() => setActiveSection("dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">
              ATS Score
            </span>
            <span className="text-xl font-bold text-slate-900">
              {ats.atsScore} / 100
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">
              Matched Skills
            </span>
            <span className="text-xl font-bold text-slate-900">
              {ats.matchedSkills?.length || 0} Acquired
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">
              Missing Skill Gaps
            </span>
            <span className="text-xl font-bold text-slate-900">
              {ats.missingSkills?.length || 0} Gaps Identified
            </span>
          </div>
        </div>
      </div>

      {/* Matched Skills Inventory */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched
          Benchmark Skills ({ats.matchedSkills?.length || 0})
        </h3>
        <div className="flex flex-wrap gap-2">
          {ats.matchedSkills?.length ? (
            ats.matchedSkills.map((s) => (
              <span
                key={s}
                className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> {s}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">
              No skills matched target benchmark yet.
            </span>
          )}
        </div>
      </div>

      {/* Skill Gaps Breakdown & Learning Pathways */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" /> Categorized Skill Gaps
            & Study Plans
          </h3>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Missing Skill Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGaps.length ? (
            filteredGaps.map((gapItem) => {
              const topics = getStudyTopics(gapItem.skill);
              return (
                <div
                  key={gapItem.skill}
                  className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {gapItem.skill}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md shrink-0">
                        {gapItem.category}
                      </span>
                    </div>

                    {/* Gap Severity Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Gap Severity</span>
                        <span className="font-mono font-bold text-slate-700">
                          {gapItem.gap}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full bar-fill"
                          style={{ width: `${gapItem.gap}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Curated Study Topics */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-600" />{" "}
                      Recommended Learning Path
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {topics.map((t, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-slate-700">
                No skill gaps found for this category!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
