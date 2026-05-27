import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user.role === "ADMIN";
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const handleLogout = async () => {
    try {
      // Call logout API
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear all auth data
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");

      // Always redirect to login page
      navigate("/login", { replace: true });
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const adminNavLinks = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/add-resident", label: "Add Resident", icon: "➕" },
    { path: "/manage-rooms", label: "Manage Rooms", icon: "🛏️" },
    { path: "/food-menu-management", label: "Food Menu", icon: "🍛" },
    { path: "/complaints", label: "Complaint Management", icon: "📝" },
    { path: "/circulars", label: "Circular Management", icon: "📢" },
    { path: "/admin-food-confirmations", label: "Food Confirmations", icon: "🍽️" },
    { path: "/vacated", label: "Vacated List", icon: "👥" },
  ];

  const superAdminNavLinks = [
    { path: "/superadmin/dashboard", label: "SuperAdmin Control", icon: "🛡️" },
    { path: "/superadmin/hostels", label: "Hostel Management", icon: "🏢" },
    { path: "/superadmin/users", label: "User Management", icon: "👥" },
    { path: "/superadmin/reports", label: "Financial Reports", icon: "💰" },
    { path: "/superadmin/activities", label: "Activity Logs", icon: "📋" },
  ];

  const userNavLinks = [
    { path: "/user-dashboard", label: "Home", icon: "🏠" },
    { path: "/food-menu", label: "Today Food Menu", icon: "🍽️" },
    { path: "/food-confirmation", label: "Food Confirmation", icon: "✅" },
    { path: "/user-complaints", label: "My Complaints", icon: "📝" },
    { path: "/user-circulars", label: "Announcements", icon: "📢" },
    { path: "/user-profile", label: "Profile", icon: "👤" },
  ];

  const navLinks = isSuperAdmin ? superAdminNavLinks : isAdmin ? adminNavLinks : userNavLinks;

  return (
    <>
      <button 
        className="mobile-toggle" 
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        ☰
      </button>
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <h1>🏠 Hostel</h1>
          <button 
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="user-role-badge">
          {isSuperAdmin ? "🛡️ SuperAdmin" : isAdmin ? "👨‍💼 Admin" : "👤 User"}
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`nav-link ${isActive(link.path)}`}
              onClick={() => {
                navigate(link.path);
                setMobileOpen(false);
              }}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{user.name || "User"}</p>
            <p className="user-email">{user.email || "N/A"}</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
