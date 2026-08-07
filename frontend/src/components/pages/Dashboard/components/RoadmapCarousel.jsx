import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

export default function RoadmapCarousel({ steps }) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];

  return (
    <div>
      <div className="fade-in" key={current}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
            {step.phase}
          </span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
              step.status === "pending"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {step.status === "locked" ? "🔒 Locked" : "Upcoming"}
          </span>
        </div>
        <div className="text-sm font-bold text-slate-900 mb-1">
          {step.title}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          {step.description}
        </p>
        <div className="space-y-1.5">
          {step.resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {r.label}
            </a>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => setCurrent((p) => Math.max(0, p - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <span className="text-[10px] font-mono text-slate-400">
          {current + 1} / {steps.length}
        </span>
        <button
          onClick={() => setCurrent((p) => Math.min(steps.length - 1, p + 1))}
          disabled={current === steps.length - 1}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? "bg-indigo-600 w-3" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
