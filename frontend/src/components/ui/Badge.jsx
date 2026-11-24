import React from "react";

const badgeStyles = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "3px 8px",
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.03em"
};

const variants = {
  success: { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" },
  danger: { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" },
  warning: { background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" },
  info: { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" },
  primary: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  secondary: { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }
};

export default function Badge({ children, variant = "secondary", style = {}, className = "" }) {
  const currentVariant = variants[variant] || variants.secondary;

  return (
    <span
      className={`badge ${className}`}
      style={{
        ...badgeStyles,
        ...currentVariant,
        ...style
      }}
    >
      {children}
    </span>
  );
}
