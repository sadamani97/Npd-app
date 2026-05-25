import React from "react";

export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  required = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <div className={["form-group", className].filter(Boolean).join(" ")}>
      {label && <label htmlFor={id || name}>{label}</label>}
      <select
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
