import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Auth.css";
import { Button, Input, Alert, Card } from "../components/ui";

export default function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Clear any existing tokens to prevent concurrent login
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      
      const loginEndpoint = formData.email.trim().toLowerCase() === "superadmin@hostel.com"
        ? "/auth/super-admin/login"
        : "/auth/login";

      const res = await API.post(loginEndpoint, formData);
      
      if (res.data.success) {
        const userRole = res.data.user.role;
        
        // Store tokens based on user role
        if (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "HOSTEL_ADMIN") {
          localStorage.setItem("adminToken", res.data.token);
          localStorage.setItem("admin", JSON.stringify(res.data.user));
        } else {
          localStorage.setItem("userToken", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        setIsAuthenticated(true);
        
        // Redirect based on user role
        if (userRole === "ADMIN" || userRole === "HOSTEL_ADMIN") {
          navigate("/dashboard", { replace: true });
        } else if (userRole === "SUPER_ADMIN") {
          navigate("/superadmin/dashboard", { replace: true });
        } else {
          navigate("/user-dashboard", { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to quickly create the test user if missing from database
  const handleCreateTestUser = async () => {
    try {
      setLoading(true);
      const response = await API.post("/auth/register", {
        name: "Test User",
        email: "user@hostel.com",
        password: "user1234",
        phone: "0987654321",
        role: "USER"
      });
      alert("✅ Test user created successfully! You can now log in with:\nEmail: user@hostel.com\nPassword: user1234");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.msg || err.message;
      if (errorMsg.includes("already exists")) {
        alert("✅ Test user already exists!\nYou can log in with:\nEmail: user@hostel.com\nPassword: user1234");
      } else {
        alert("Error: " + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card>
        <h1>hostel</h1>
        <h2>Hostel Login</h2>

        <Alert>{error}</Alert>

        <form onSubmit={handleLogin}>
          <Input
            label="Email or Phone Number"
            type="text"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email or phone number"
            required
          />

          <Input
            label="Password"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center mt-3" style={{ fontSize: "0.9rem", color: "#666" }}>
          <p style={{ margin: "5px 0" }}><strong>Admin:</strong> admin@hostel.com | admin123</p>
          <p style={{ margin: "5px 0" }}><strong>User:</strong> user@hostel.com | user1234</p>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCreateTestUser}
            style={{ marginTop: "10px", padding: "5px 10px", fontSize: "0.8rem" }}
          >
            🛠️ Click here to create Test User if login fails
          </Button>
        </div>
      </Card>
    </div>
  );
}
