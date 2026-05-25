import React from "react";

export default function Textarea({
  label,
  id,
  name,
  value,
  placeholder,
  onChange,
  required = false,
  rows = 4,
  className = "",
  ...rest
}) {
  return (
    <div className={["form-group", className].filter(Boolean).join(" ")}>
      {label && <label htmlFor={id || name}>{label}</label>}
      <textarea
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        {...rest}
      />
    </div>
  );
}
