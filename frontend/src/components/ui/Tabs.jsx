import React from "react";
import "./Tabs.css";

export function Tabs({ tabs = [], activeTab, onChange, className = "" }) {
  return (
    <div className={`tab-container ${className}`}>
      <div className="tab-list" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`tab-button ${isActive ? "active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span className="tab-badge">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({ id, activeTab, children, className = "" }) {
  if (id !== activeTab) return null;
  return (
    <div role="tabpanel" className={`tab-panel ${className}`}>
      {children}
    </div>
  );
}

export default Tabs;
