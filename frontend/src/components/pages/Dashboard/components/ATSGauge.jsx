import React from "react";

export default function ATSGauge({ score }) {
  const color =
    score >= 76
      ? "text-indigo-600"
      : score >= 51
        ? "text-amber-500"
        : "text-red-500";
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-slate-100"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className={`${color} gauge-arc`}
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900 leading-none">
          {score}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          / 100
        </span>
      </div>
    </div>
  );
}
