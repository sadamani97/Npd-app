import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1>🏠 Hostel Management System</h1>
          <p>Welcome to Hostel Management Dashboard</p>
        </div>

        <div className="login-options">
          {/* Login */}
          <div className="login-card admin-card">
            <div className="card-icon">🔐</div>
            <h2>Hostel Management Login</h2>
            <p>Login with your email and password</p>
            <p className="credentials">
              <strong>Admin Email:</strong> admin@hostel.com | admin123<br />
              <strong>User Email:</strong> user@hostel.com | user1234
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>

        <div className="home-footer">
          <p>© 2024 Hostel Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
