import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";
import { Button, Input, Alert, Card } from "../components/ui";

// Validation schema for legacy email/password login
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

export default function Login({ setIsAuthenticated }) {
  // mode: 'password' | 'otp_request' | 'otp_verify'
  const [mode, setMode] = useState("password");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const { login, requestOtp, verifyOtp, registerTestUser, getRedirectPath, loading } = useAuth();

  // Countdown timer for OTP Resend
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Handle Requesting / Generating OTP via SMS
  const handleGenerateOtp = async (e) => {
    if (e) e.preventDefault();
    setApiError("");
    setSuccessMsg("");
    setDemoOtp("");

    const normalizedPhone = phone.replace(/\D/g, "");
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      setApiError("Please enter a valid 10-digit mobile number");
      return;
    }

    const res = await requestOtp(normalizedPhone, "SMS");
    if (res.success) {
      setMode("otp_verify");
      setSuccessMsg(res.message || "OTP sent to your mobile number via SMS");
      setResendTimer(30);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
    } else {
      setApiError(res.message);
    }
  };

  // Handle Verifying 6-digit OTP & Logging In
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMsg("");

    const normalizedPhone = phone.replace(/\D/g, "");
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setApiError("Please enter a valid 6-digit OTP code");
      return;
    }

    const res = await verifyOtp(normalizedPhone, cleanOtp);
    if (res.success) {
      setIsAuthenticated(true);
      const targetPath = getRedirectPath(res.role || "USER");
      navigate(targetPath, { replace: true });
    } else {
      setApiError(res.message || "Wrong OTP");
    }
  };

  // Password-based Formik handler
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

  // Helper to quickly create test user
  const handleCreateTestUser = async () => {
    setApiError("");
    const res = await registerTestUser();
    if (res.success) {
      alert("✅ Test user created successfully!\nPhone: 0987654321\nEmail: user@hostel.com\nPassword: user1234");
    } else {
      if (res.message.includes("already exists")) {
        alert("✅ Test user already exists!\nPhone: 0987654321\nEmail: user@hostel.com\nPassword: user1234");
      } else {
        alert("Error: " + res.message);
      }
    }
  };

  return (
    <div className="auth-container">
      <Card>
        <h1>Hostel Management</h1>
        <h2>Account Login</h2>

        {apiError && <Alert variant="danger">{apiError}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        {/* MODE 1: Email & Password (Default View) */}
        {mode === "password" && (
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

            {/* Option to login using OTP */}
            <div className="text-center mt-3">
              <button
                type="button"
                className="otp-toggle-btn"
                onClick={() => {
                  setMode("otp_request");
                  setApiError("");
                  setSuccessMsg("");
                }}
              >
                📱 Login using OTP
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: Enter Mobile Number & Generate OTP */}
        {mode === "otp_request" && (
          <form onSubmit={handleGenerateOtp}>
            <Input
              label="Mobile Number"
              type="tel"
              id="mobile_number"
              name="mobile_number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              required
            />

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Generating OTP..." : "📩 Generate OTP"}
            </Button>

            <div className="text-center mt-3">
              <button
                type="button"
                className="otp-toggle-btn"
                onClick={() => {
                  setMode("password");
                  setApiError("");
                  setSuccessMsg("");
                }}
              >
                🔑 Login using Email & Password
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: Enter 6-digit OTP & Verify */}
        {mode === "otp_verify" && (
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-step-header" style={{ marginBottom: "12px", fontSize: "0.9rem", color: "#555" }}>
              OTP sent to <strong>+91 {phone}</strong>.{" "}
              <button
                type="button"
                className="phone-change-btn"
                onClick={() => {
                  setMode("otp_request");
                  setOtp("");
                  setDemoOtp("");
                  setApiError("");
                  setSuccessMsg("");
                }}
              >
                Change Number
              </button>
            </div>

            {demoOtp && (
              <div className="demo-otp-banner">
                ℹ️ <strong>Demo Mode OTP:</strong> Use code <code>{demoOtp}</code>
              </div>
            )}

            <Input
              label="Enter 6-Digit OTP"
              type="text"
              id="otp_code"
              name="otp_code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
            />

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Verifying..." : "✅ Verify OTP & Login"}
            </Button>

            <div className="resend-container">
              {resendTimer > 0 ? (
                <span>Resend OTP in <strong>{resendTimer}s</strong></span>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleGenerateOtp}
                  disabled={loading}
                >
                  Didn't get OTP? Resend OTP
                </button>
              )}
            </div>

            <div className="text-center mt-3">
              <button
                type="button"
                className="otp-toggle-btn"
                onClick={() => {
                  setMode("password");
                  setApiError("");
                  setSuccessMsg("");
                }}
              >
                🔑 Login using Email & Password
              </button>
            </div>
          </form>
        )}

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
          <p style={{ margin: "5px 0" }}><strong>User Mobile:</strong> 0987654321 (or registered number)</p>
          <p style={{ margin: "5px 0" }}><strong>Admin Email:</strong> admin@hostel.com | admin123</p>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCreateTestUser}
            style={{ marginTop: "10px", padding: "5px 10px", fontSize: "0.8rem" }}
          >
            🛠️ Click here to create Test User if needed
          </Button>
        </div>
      </Card>
    </div>
  );
}

