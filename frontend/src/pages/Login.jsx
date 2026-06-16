import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";
import { Button, Input, Alert, Card } from "../components/ui";

// Validation schema using Yup
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .required("Email or Phone Number is required")
    .test(
      "email-or-phone",
      "Must be a valid email or a 10-digit phone number",
      (value) => {
        if (!value) return false;
        // Simple checks for email or 10-digit phone number
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isPhone = /^\d{10}$/.test(value.replace(/\D/g, ""));
        return isEmail || isPhone;
      }
    ),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login({ setIsAuthenticated }) {
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();
  const { login, registerTestUser, getRedirectPath, loading } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      setApiError("");
      const res = await login(values.email, values.password);
      if (res.success) {
        setIsAuthenticated(true);
        navigate(getRedirectPath(res.role), { replace: true });
      } else {
        setApiError(res.message);
      }
    },
  });

  // Helper to quickly create the test user if missing from database
  const handleCreateTestUser = async () => {
    setApiError("");
    const res = await registerTestUser();
    if (res.success) {
      alert("✅ Test user created successfully! You can now log in with:\nEmail: user@hostel.com\nPassword: user1234");
    } else {
      if (res.message.includes("already exists")) {
        alert("✅ Test user already exists!\nYou can log in with:\nEmail: user@hostel.com\nPassword: user1234");
      } else {
        alert("Error: " + res.message);
      }
    }
  };

  return (
    <div className="auth-container">
      <Card>
        <h1>hostel</h1>
        <h2>Hostel Login</h2>

        {apiError && <Alert>{apiError}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <Input
            label="Email or Phone Number"
            type="text"
            id="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your email or phone number"
          />
          {formik.touched.email && formik.errors.email ? (
            <div className="error-feedback" style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "-10px", marginBottom: "15px", textAlign: "left" }}>
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
            placeholder="Enter your password"
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="error-feedback" style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "-10px", marginBottom: "15px", textAlign: "left" }}>
              {formik.errors.password}
            </div>
          ) : null}

          <Button type="submit" variant="primary" disabled={loading || formik.isSubmitting}>
            {loading || formik.isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center mt-3" style={{ fontSize: "0.9rem", color: "#666" }}>
          <p style={{ margin: "5px 0" }}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              style={{ color: "#3498db", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }}
            >
              Sign Up
            </span>
          </p>
          <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "15px 0" }} />
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
