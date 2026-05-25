import React from "react";
import "../../styles/Form.css";

export default function Button({
  variant = "primary",
  children,
  className = "",
  style = {},
  ...rest
}) {
  const variantClass = variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : variant;

  return (
    <button className={["btn", variantClass, className].filter(Boolean).join(" ")} style={style} {...rest}>
      {children}
    </button>
  );
}
