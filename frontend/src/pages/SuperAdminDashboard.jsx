import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../utils/authUtils";
import "../styles/SuperAdminDashboard.css";

export default function SuperAdminDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState("overview");

  const sidebarItems = [
    { id: "overview", label: "Dashboard Overview", icon: "📊" },
    { id: "hostels", label: "Hostel Management", icon: "🏢" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "financial", label: "Financial Reports", icon: "💰" },
    { id: "modules", label: "Module Access", icon: "⚙️" },
    { id: "settings", label: "System Settings", icon: "🔧" },
    { id: "activities", label: "Activity Monitoring", icon: "📋" },
    { id: "support", label: "Support & Help", icon: "🆘" }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Prevent body scrolling while SuperAdmin dashboard is mounted
  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const renderContent = () => {
    switch (selectedFeature) {
      case "overview":
        return (
          <div className="feature-section">
            <h2>📊 Dashboard Overview</h2>
            <p>Key metrics and system statistics at a glance</p>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Total Hostels</div>
                <p className="metric-value">0</p>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active Hostels</div>
                <p className="metric-value">0</p>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Users</div>
                <p className="metric-value">0</p>
              </div>
              <div className="metric-card">
                <div className="metric-label">Pending Approvals</div>
                <p className="metric-value">0</p>
              </div>
            </div>

            <h3 style={{ marginTop: "30px", color: "#1e293b", fontWeight: "700" }}>Quick Actions</h3>
            <div className="btn-group">
              <button className="btn-primary">Register New Hostel</button>
              <button className="btn-secondary">View Reports</button>
              <button className="btn-secondary">View Activity Logs</button>
            </div>
          </div>
        );

      case "hostels":
        return (
          <div className="feature-section">
            <h2>🏢 Hostel Management</h2>
            <p>Register, approve, and manage all hostels on the platform</p>
            
            <div className="btn-group">
              <button className="btn-primary">Register New Hostel</button>
              <button className="btn-secondary">View All Hostels</button>
              <button className="btn-secondary">Pending Approvals</button>
            </div>

            <div className="info-box">
              <div className="info-box-title">Hostel Management Permissions</div>
              <ul>
                <li>Create and register new hostels</li>
                <li>Approve or reject hostel applications</li>
                <li>Manage hostel status (ACTIVE, INACTIVE, SUSPENDED)</li>
                <li>View hostel details and analytics</li>
                <li>Manage subscription plans</li>
              </ul>
            </div>

            <h3 style={{ marginTop: "25px", color: "#1e293b", fontWeight: "700" }}>Recent Hostels</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hostel Name</th>
                    <th>Owner</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="5" style={{ textAlign: "center", color: "#94a3b8" }}>No hostels registered yet</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="feature-section">
            <h2>👥 User Management</h2>
            <p>Create, manage, and assign roles to users</p>
            
            <div className="btn-group">
              <button className="btn-primary">Create New User</button>
              <button className="btn-secondary">View All Users</button>
              <button className="btn-secondary">Manage Roles</button>
            </div>

            <div className="info-box">
              <div className="info-box-title">User Management Permissions</div>
              <ul>
                <li>Create users with different roles (SUPER_ADMIN, HOSTEL_ADMIN, ADMIN, USER)</li>
                <li>Enable or disable user accounts</li>
                <li>Modify user permissions and access levels</li>
                <li>View user activity and login history</li>
                <li>Reset user passwords</li>
              </ul>
            </div>

            <h3 style={{ marginTop: "25px", color: "#1e293b", fontWeight: "700" }}>Available Roles</h3>
            <div className="cards-grid">
              <div className="card">
                <div className="card-icon">🛡️</div>
                <div className="card-title">Super Admin</div>
                <div className="card-description">Full platform access with no restrictions</div>
              </div>
              <div className="card">
                <div className="card-icon">🏢</div>
                <div className="card-title">Hostel Admin</div>
                <div className="card-description">Manage specific hostel operations</div>
              </div>
              <div className="card">
                <div className="card-icon">👨‍💼</div>
                <div className="card-title">Admin</div>
                <div className="card-description">Administrative access to assigned hostel</div>
              </div>
              <div className="card">
                <div className="card-icon">👤</div>
                <div className="card-title">User</div>
                <div className="card-description">Hostel resident with basic access</div>
              </div>
            </div>
          </div>
        );

      case "financial":
        return (
          <div className="feature-section">
            <h2>💰 Financial Reports</h2>
            <p>Access comprehensive financial data across all hostels</p>
            
            <div className="btn-group">
              <button className="btn-primary">Generate Revenue Report</button>
              <button className="btn-secondary">Payment Status</button>
              <button className="btn-secondary">Outstanding Dues</button>
              <button className="btn-secondary">Expense Reports</button>
            </div>

            <div className="metrics-grid" style={{ marginTop: "25px" }}>
              <div className="metric-card">
                <div className="metric-label">Total Revenue</div>
                <p className="metric-value">₹0</p>
              </div>
              <div className="metric-card">
                <div className="metric-label">Pending Payments</div>
                <p className="metric-value">₹0</p>
              </div>
              <div className="metric-card">
                <div className="metric-label">Completed Payments</div>
                <p className="metric-value">₹0</p>
              </div>
              <div className="metric-card">
                <div className="metric-label">Outstanding Dues</div>
                <p className="metric-value">₹0</p>
              </div>
            </div>

            <div className="info-box">
              <div className="info-box-title">Financial Report Permissions</div>
              <p>View all financial reports and transaction history across all hostels including:</p>
              <ul>
                <li>Revenue and income statements</li>
                <li>Payment status and history</li>
                <li>Outstanding dues and collections</li>
                <li>Expense breakdowns</li>
                <li>Financial summaries by hostel</li>
              </ul>
            </div>
          </div>
        );

      case "modules":
        return (
          <div className="feature-section">
            <h2>⚙️ Module Access</h2>
            <p>Access and manage all platform modules</p>

            <div className="feature-cards-grid" style={{ marginTop: "20px" }}>
              <div className="feature-card">
                <div className="feature-card-icon">📋</div>
                <div className="feature-card-title">Complaints</div>
                <div className="feature-card-desc">Manage complaint system</div>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">📢</div>
                <div className="feature-card-title">Circulars</div>
                <div className="feature-card-desc">Broadcast announcements</div>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">🍔</div>
                <div className="feature-card-title">Food Menu</div>
                <div className="feature-card-desc">Manage food menus</div>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">🛏️</div>
                <div className="feature-card-title">Rooms</div>
                <div className="feature-card-desc">Room management</div>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">💳</div>
                <div className="feature-card-title">Payments</div>
                <div className="feature-card-desc">Payment tracking</div>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">⚡</div>
                <div className="feature-card-title">Electricity</div>
                <div className="feature-card-desc">Meter management</div>
              </div>
            </div>

            <div className="info-box" style={{ marginTop: "25px" }}>
              <div className="info-box-title">Module Access</div>
              <p>As SuperAdmin, you have access to all modules across all hostels with full control and monitoring capabilities.</p>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="feature-section">
            <h2>🔧 System Settings</h2>
            <p>Configure system-wide settings and configurations</p>

            <div className="cards-grid" style={{ marginTop: "20px" }}>
              <div className="card">
                <div className="card-icon">⚙️</div>
                <div className="card-title">Platform Config</div>
                <div className="card-description">General platform settings</div>
                <button className="btn-secondary" style={{ width: "100%" }}>Configure</button>
              </div>
              <div className="card">
                <div className="card-icon">📧</div>
                <div className="card-title">Email Settings</div>
                <div className="card-description">Email and notifications</div>
                <button className="btn-secondary" style={{ width: "100%" }}>Configure</button>
              </div>
              <div className="card">
                <div className="card-icon">💳</div>
                <div className="card-title">Subscription Plans</div>
                <div className="card-description">Plans and pricing</div>
                <button className="btn-secondary" style={{ width: "100%" }}>Configure</button>
              </div>
              <div className="card">
                <div className="card-icon">🔐</div>
                <div className="card-title">Security</div>
                <div className="card-description">Security settings</div>
                <button className="btn-secondary" style={{ width: "100%" }}>Configure</button>
              </div>
              <div className="card">
                <div className="card-icon">🌐</div>
                <div className="card-title">API Settings</div>
                <div className="card-description">API configuration</div>
                <button className="btn-secondary" style={{ width: "100%" }}>Configure</button>
              </div>
              <div className="card">
                <div className="card-icon">📊</div>
                <div className="card-title">Logs & Backup</div>
                <div className="card-description">System logs and backups</div>
                <button className="btn-secondary" style={{ width: "100%" }}>Configure</button>
              </div>
            </div>
          </div>
        );

      case "activities":
        return (
          <div className="feature-section">
            <h2>📋 Activity Monitoring</h2>
            <p>Track and monitor user activities across the system</p>

            <div className="btn-group">
              <button className="btn-primary">View Activity Logs</button>
              <button className="btn-secondary">Login History</button>
              <button className="btn-secondary">Data Changes</button>
              <button className="btn-secondary">Export Report</button>
            </div>

            <h3 style={{ marginTop: "25px", color: "#1e293b", fontWeight: "700" }}>Recent Activities</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="4" style={{ textAlign: "center", color: "#94a3b8" }}>No activity logged yet</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "support":
        return (
          <div className="feature-section">
            <h2>🆘 Support & Help</h2>
            <p>System support and technical assistance</p>

            <div className="cards-grid" style={{ marginTop: "20px" }}>
              <div className="card">
                <div className="card-icon">✅</div>
                <div className="card-title">System Status</div>
                <div className="card-description">
                  <p style={{ margin: 0, color: "#16a34a", fontWeight: "600" }}>✓ All Systems Operational</p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748b" }}>Database: Connected | API: Running</p>
                </div>
              </div>
              <div className="card">
                <div className="card-icon">📚</div>
                <div className="card-title">Documentation</div>
                <div className="card-description">View documentation and guides</div>
                <button className="btn-secondary" style={{ width: "100%", marginTop: "10px" }}>View Docs</button>
              </div>
              <div className="card">
                <div className="card-icon">💬</div>
                <div className="card-title">Contact Support</div>
                <div className="card-description">Get technical support</div>
                <button className="btn-secondary" style={{ width: "100%", marginTop: "10px" }}>Contact</button>
              </div>
            </div>

            <div className="info-box" style={{ marginTop: "25px" }}>
              <div className="info-box-title">Support Information</div>
              <p>For urgent issues, please contact the support team immediately.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="superadmin-container">
      {/* Sidebar */}
      <aside className="superadmin-sidebar">
        <div className="sidebar-header">
          <h1>🛡️</h1>
          <p>SuperAdmin</p>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${selectedFeature === item.id ? "active" : ""}`}
              onClick={() => setSelectedFeature(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{user.name || "SuperAdmin"}</p>
            <p className="user-email">{user.email || "N/A"}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="superadmin-main">
        {/* Header */}
        <header className="superadmin-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Welcome, {user.name || "SuperAdmin"}</h1>
              <p>Complete control over the entire platform</p>
            </div>
            <div className="header-info">
              <div className="info-badge">🛡️ SuperAdmin Role</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="superadmin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
