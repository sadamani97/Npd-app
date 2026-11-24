import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="layout-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
