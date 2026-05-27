import React from "react";

export default function Card({ children, className = "" }) {
  return <div className={["auth-card", className].filter(Boolean).join(" ")}>{children}</div>;
}
