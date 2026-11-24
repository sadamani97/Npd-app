import React from "react";
import "./Card.css";

export default function Card({
  children,
  title,
  icon,
  subtitle,
  badge,
  onClick,
  clickable = false,
  className = "",
  variant = "default",
  headerRight
}) {
  const isClickable = clickable || Boolean(onClick);
  const classes = [
    "ui-card",
    `ui-card-${variant}`,
    isClickable ? "ui-card-clickable" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} onClick={isClickable ? onClick : undefined}>
      {(title || icon || headerRight || badge) && (
        <div className="ui-card-header">
          <div className="ui-card-title-group">
            {icon && <span className="ui-card-icon">{icon}</span>}
            <div>
              {title && <h3 className="ui-card-title">{title}</h3>}
              {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {headerRight && <div className="ui-card-header-right">{headerRight}</div>}
          {badge && <span className="ui-card-badge">{badge}</span>}
          {isClickable && !headerRight && <span className="ui-card-arrow">→</span>}
        </div>
      )}
      {children && <div className="ui-card-body">{children}</div>}
    </div>
  );
}
