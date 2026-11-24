import React from "react";
import "./Shimmer.css";

export function Shimmer({ width = "100%", height = "16px", borderRadius = "6px", style = {}, className = "" }) {
  return (
    <div
      className={`shimmer-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

export function CardSkeleton({ lines = 3, height = "120px", className = "" }) {
  return (
    <div className={`shimmer-card ${className}`} style={{ minHeight: height }}>
      <Shimmer width="40%" height="24px" />
      <Shimmer width="70%" height="16px" />
      {Array.from({ length: Math.max(0, lines - 2) }).map((_, i) => (
        <Shimmer key={i} width={`${90 - i * 15}%`} height="14px" />
      ))}
    </div>
  );
}

export function StatsGridSkeleton({ count = 4 }) {
  return (
    <div className="shimmer-stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Shimmer width="50%" height="18px" />
            <Shimmer width="28px" height="28px" borderRadius="50%" />
          </div>
          <Shimmer width="35%" height="32px" />
          <Shimmer width="65%" height="14px" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="shimmer-table-container">
      {/* Header */}
      <div className="shimmer-table-row" style={{ paddingBottom: "16px", borderBottom: "2px solid #eef0f3" }}>
        {Array.from({ length: columns }).map((_, colIdx) => (
          <Shimmer key={colIdx} width={`${100 / columns}%`} height="20px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="shimmer-table-row">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Shimmer
              key={colIdx}
              width={`${Math.max(40, 95 - ((colIdx * 17 + rowIdx * 11) % 40))}%`}
              height="16px"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Shimmer;
