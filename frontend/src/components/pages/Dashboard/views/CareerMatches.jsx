import React from "react";
import {
  Target,
  Sparkles,
  TrendingUp,
  Briefcase,
  DollarSign,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export default function CareerMatches({
  analysisResult,
  setActiveSection,
  setTargetRole,
}) {
  const predictions = analysisResult?.careerPredictions || [];

  // Metadata helper for career path insights
  const getRoleDetails = (roleName) => {
    const name = roleName.toLowerCase();
    if (name.includes("machine learning") || name.includes("ml") || name.includes("ai")) {
      return {
        summary: "Build, train, and deploy artificial intelligence and deep learning models to solve complex predictive problems.",
        demand: "Very High Demand",
        keySkills: ["Python", "PyTorch/TensorFlow", "Deep Learning", "SQL", "Model Deployment"],
      };
    } else if (name.includes("backend") || name.includes("software") || name.includes("developer")) {
      return {
        summary: "Design high-performance server architectures, REST/gRPC APIs, databases, and microservices.",
        demand: "High Demand",
        keySkills: ["Go/Java/Python", "RESTful APIs", "PostgreSQL/MongoDB", "Docker", "System Design"],
      };
    } else if (name.includes("devops") || name.includes("system") || name.includes("cloud")) {
      return {
        summary: "Manage cloud infrastructure, CI/CD pipelines, containerization, and system reliability.",
        demand: "High Demand",
        keySkills: ["Docker/Kubernetes", "Linux", "CI/CD", "Cloud (AWS/GCP)", "Terraform"],
      };
    } else if (name.includes("data") || name.includes("dba") || name.includes("database")) {
      return {
        summary: "Optimize relational and NoSQL database structures, query performance, and data warehousing.",
        demand: "Moderate-High Demand",
        keySkills: ["SQL", "PostgreSQL", "Query Optimization", "Database Architecture", "ETL"],
      };
    } else {
      return {
        summary: "Engineering specialization focused on delivery, quality assurance, and technical execution.",
        demand: "Moderate Demand",
        keySkills: ["Problem Solving", "System Architecture", "Git", "Testing & Debugging"],
      };
    }
  };

  if (!predictions.length) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200/60 text-center py-20 shadow-sm max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          No Active Career Predictions
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Upload your resume on the main Dashboard to run the AI prediction model and generate interactive career path recommendations.
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

  const handleSelectRole = (roleTitle) => {
    if (setTargetRole) {
      setTargetRole(roleTitle);
    }
    setActiveSection("dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Career Path Analytics
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Top Matched Career Paths
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Evaluated using your extracted resume skills, experience history, and ML ensemble models.
          </p>
        </div>

        <button
          onClick={() => setActiveSection("dashboard")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {/* Career Prediction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((match, idx) => {
          const details = getRoleDetails(match.role);
          return (
            <div
              key={match.role}
              className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm card-hover flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                {/* Header Badge & Match Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {match.role}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg shrink-0">
                    {match.confidence}% Match
                  </span>
                </div>

                {/* Match Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`${match.color || "bg-indigo-600"} h-full rounded-full bar-fill`}
                    style={{ width: `${match.confidence}%` }}
                  />
                </div>

                {/* Role Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {details.summary}
                </p>

                {/* Industry Demand Insight */}
                <div className="pt-1 text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700 font-medium w-fit">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{details.demand}</span>
                  </div>
                </div>

                {/* Required Tech Stack Badges */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                    Key Required Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {details.keySkills.map((sk) => (
                      <span
                        key={sk}
                        className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectRole(match.role)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 transition-all cursor-pointer"
              >
                <span>Select & Analyze Target Role</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
