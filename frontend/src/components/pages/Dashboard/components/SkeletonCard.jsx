import React from "react";

export default function SkeletonCard({ lines = 3, height = "h-4" }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${height} ${i === 0 ? "w-2/3" : i % 2 === 0 ? "w-full" : "w-4/5"}`}
        />
      ))}
    </div>
  );
}
