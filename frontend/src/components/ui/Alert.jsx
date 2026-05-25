import React from "react";

export default function Alert({ children, className = "" }) {
  if (!children) return null;
  return <div className={["error-message", className].filter(Boolean).join(" ")}>{children}</div>;
}
