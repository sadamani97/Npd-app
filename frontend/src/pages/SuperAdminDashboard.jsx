import React from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";
import { Button } from "../components/ui";
import "../styles/Dashboard.css";

export default function SuperAdminDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>SuperAdmin Dashboard</h1>
        <p>Welcome back, {user.name || "SuperAdmin"}.</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Hostel Management</h2>
          <p>Register and approve hostels, and manage hostel-level access.</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Admin Dashboard</Button>
        </div>

        <div className="dashboard-card">
          <h2>Analytics</h2>
          <p>View aggregated analytics across all hostels.</p>
          <Button onClick={() => navigate("/dashboard")}>View Reports</Button>
        </div>

        <div className="dashboard-card">
          <h2>Support</h2>
          <p>Use your SuperAdmin access to review hostel performance and approvals.</p>
        </div>
      </div>
    </div>
  );
}
