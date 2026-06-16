import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";
import { Button, Input, Alert, Card } from "../components/ui";

// Validation schema using Yup
const SignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
});

export default function Signup() {
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const { signup, loading } = useAuth();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: SignupSchema,
    onSubmit: async (values, { resetForm }) => {
      setApiError("");
      setSuccessMsg("");
      
      const res = await signup(values.name, values.email, values.password);
      if (res.success) {
        setSuccessMsg("🎉 Registered successfully! Redirecting to login...");
        resetForm();
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setApiError(res.message);
      }
    },
  });

  return (
    <div className="auth-container">
      <Card>
        <h1>hostel</h1>
        <h2>Resident Signup</h2>

        {apiError && <Alert variant="error">{apiError}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            id="name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your full name"
          />
          {formik.touched.name && formik.errors.name ? (
            <div className="error-feedback" style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "-10px", marginBottom: "15px", textAlign: "left" }}>
              {formik.errors.name}
            </div>
          ) : null}

          <Input
            label="Email Address"
            type="email"
            id="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your email address"
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
            placeholder="Create a password"
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="error-feedback" style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "-10px", marginBottom: "15px", textAlign: "left" }}>
              {formik.errors.password}
            </div>
          ) : null}

          <Input
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Confirm your password"
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
            <div className="error-feedback" style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "-10px", marginBottom: "15px", textAlign: "left" }}>
              {formik.errors.confirmPassword}
            </div>
          ) : null}

          <Button type="submit" variant="primary" disabled={loading || formik.isSubmitting}>
            {loading || formik.isSubmitting ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        <div className="text-center mt-3" style={{ fontSize: "0.9rem", color: "#666" }}>
          <p style={{ margin: "5px 0" }}>
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: "#3498db", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }}
            >
              Login
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
