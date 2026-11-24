import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";
import { Button, Input, Alert, Card } from "../components/ui";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .required("Email or Phone Number is required")
    .test(
      "email-or-phone",
      "Must be a valid email or a 10-digit phone number",
      (value) => {
        if (!value) return false;
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isPhone = /^\d{10}$/.test(value.replace(/\D/g, ""));
        return isEmail || isPhone;
      }
    ),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const DEMO_ACCOUNTS = {
  admin: {
    label: "👨‍💼 Hostel Admin",
    email: "admin@hostel.com",
    password: "admin123"
  },
  resident: {
    label: "👤 Resident",
    email: "user@hostel.com",
    password: "user1234"
  },
  superadmin: {
    label: "🛡️ SuperAdmin",
    email: "superadmin@hostel.com",
    password: "superadmin123"
  }
};

export default function Login({ setIsAuthenticated }) {
  const [apiError, setApiError] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const navigate = useNavigate();

  const { login, getRedirectPath, loading } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: DEMO_ACCOUNTS.admin.email,
      password: DEMO_ACCOUNTS.admin.password,
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      setApiError("");
      const res = await login(values.email, values.password);
      if (res?.success) {
        if (typeof setIsAuthenticated === "function") {
          setIsAuthenticated(true);
        }
        navigate(getRedirectPath(res.role), { replace: true });
      } else {
        setApiError(res?.message || "Invalid credentials. Please verify your email and password.");
      }
    },
  });

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    setApiError("");
    const account = DEMO_ACCOUNTS[roleKey];
    if (account) {
      formik.setFieldValue("email", account.email);
      formik.setFieldValue("password", account.password);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1>Hostel Management</h1>
          <h2>Account Portal Login</h2>
        </div>

        {/* Quick Role Switcher Tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`role-tab-btn ${selectedRole === "admin" ? "active" : ""}`}
            onClick={() => handleSelectRole("admin")}
          >
            Admin
          </button>
          <button
            type="button"
            className={`role-tab-btn ${selectedRole === "resident" ? "active" : ""}`}
            onClick={() => handleSelectRole("resident")}
          >
            Resident
          </button>
          <button
            type="button"
            className={`role-tab-btn ${selectedRole === "superadmin" ? "active" : ""}`}
            onClick={() => handleSelectRole("superadmin")}
          >
            SuperAdmin
          </button>
        </div>

        {apiError && (
          <Alert variant="danger" className="auth-alert">
            {apiError}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Input
            label="Email or Phone Number"
            type="text"
            id="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter email or 10-digit phone"
          />
          {formik.touched.email && formik.errors.email ? (
            <div className="error-feedback">
              {formik.errors.email}
            </div>
          ) : null}

          <Input
            label="Password"
            type="password"
            id="password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter password"
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="error-feedback">
              {formik.errors.password}
            </div>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            disabled={loading || formik.isSubmitting}
            className="auth-submit-btn"
          >
            {loading || formik.isSubmitting ? "Logging in..." : `Login as ${selectedRole.toUpperCase()}`}
          </Button>
        </form>

        <div className="auth-footer-help">
          <div className="demo-credentials-box">
            <span className="demo-label">Demo Credentials:</span>
            <code>{formik.values.email}</code> | <code>{formik.values.password}</code>
          </div>

          <p className="signup-link-text">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="auth-link"
            >
              Sign Up as Resident
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
