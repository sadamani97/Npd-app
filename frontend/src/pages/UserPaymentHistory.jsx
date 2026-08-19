import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePayments } from "../hooks/usePayments";
import Layout from "../components/Layout";
import { Card, Button, Alert } from "../components/ui";
import "../styles/UserPaymentHistory.css";

export default function UserPaymentHistory() {
  const { currentUser: user } = useAuth();
  const { payments, fetchUserPayments, loading, error } = usePayments();

  const today = new Date();
  const currentDay = today.getDate();
  const isAfter10th = currentDay > 10;
  const penaltyDays = isAfter10th ? currentDay - 10 : 0;
  const lateFeePenalty = penaltyDays * 100;

  const getSharingRentAmount = (roomType, acStatus, isPremium, userRent) => {
    if (userRent && Number(userRent) > 0) return Number(userRent);
    const typeStr = String(roomType || "").toUpperCase();
    const ac = String(acStatus || "").toUpperCase() === "AC";
    const prem = Boolean(isPremium);

    if (typeStr.includes("1") || typeStr.includes("SINGLE")) {
      if (prem) return 19999;
      if (ac) return 10500;
      return 9500;
    }
    if (typeStr.includes("2") || typeStr.includes("DOUBLE")) {
      if (prem) return 14999;
      if (ac) return 7750;
      return 7000;
    }
    if (typeStr.includes("3") || typeStr.includes("TRIPLE")) {
      if (prem) return 9999;
      if (ac) return 7500;
      return 6750;
    }
    if (typeStr.includes("4") || typeStr.includes("FOUR")) {
      if (ac) return 7250;
      return 6500;
    }
    if (typeStr.includes("5") || typeStr.includes("FIVE")) return 6250;
    if (typeStr.includes("6") || typeStr.includes("SIX")) return 6000;

    return 6000;
  };

  const baseRent = getSharingRentAmount(
    user?.room_type || user?.sharing_type,
    user?.ac_status,
    user?.is_premium,
    user?.rent_amount || user?.rent
  );
  const electricityCharges = Number(user?.electricity_charges || 0);
  const totalPayable = baseRent + electricityCharges + lateFeePenalty;

  useEffect(() => {
    fetchUserPayments();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayWithRazorpay = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Razorpay SDK failed to load. Please check internet connection.");
      return;
    }

    const options = {
      key: "rzp_test_mockkey12345",
      amount: totalPayable * 100,
      currency: "INR",
      name: "Hostel Management System",
      description: `Rent & EB Payment for ${user.name || "Resident"}`,
      image: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
      handler: function (response) {
        alert(`🎉 Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: user.name || "Resident",
        email: user.email || "user@hostel.com",
        contact: user.phone || "9999999999"
      },
      theme: {
        color: "#6366f1"
      }
    };

    try {
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (e) {
      alert(`Initiating Payment for ₹${totalPayable}... (Razorpay Test Mode)`);
    }
  };

  return (
    <Layout>
      <div className="user-payments-page">
        <div className="payments-header">
          <h2>💳 My Payments & Rent Details</h2>
          <p className="subtitle">View current dues, pay online via Razorpay, and view payment history.</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Current Active Due Card */}
        <Card
          title="⚡ Current Month Rent & EB Due"
          subtitle={`Billing Cycle: ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
          variant={isAfter10th ? "warning" : "primary"}
          className="current-due-card"
        >
          <div className="due-card-body">
            <div className="due-grid">
              <div className="due-box">
                <span className="due-label">Sharing Base Rent</span>
                <span className="due-value">₹{baseRent.toLocaleString()}</span>
              </div>
              <div className="due-box">
                <span className="due-label">Electricity Charges</span>
                <span className="due-value">₹{electricityCharges.toLocaleString()}</span>
              </div>
              {isAfter10th && (
                <div className="due-box penalty-box">
                  <span className="due-label">Late Fee Penalty ({penaltyDays} days × ₹100)</span>
                  <span className="due-value penalty-text">+₹{lateFeePenalty.toLocaleString()}</span>
                </div>
              )}
              <div className="due-box total-box">
                <span className="due-label">Total Outstanding Due</span>
                <span className="due-value total-text">₹{totalPayable.toLocaleString()}</span>
              </div>
            </div>

            <div className={`due-banner ${isAfter10th ? "warning-banner" : "info-banner"}`}>
              {isAfter10th ? (
                <p>
                  ⚠️ <strong>Overdue Warning:</strong> Rent payment is overdue past the 10th. ₹100 late fee penalty accumulates daily.
                </p>
              ) : (
                <p>
                  ℹ️ <strong>Reminder:</strong> Please settle your rent before the 10th of this month.
                </p>
              )}
            </div>

            <div className="due-pay-row">
              <Button className="razorpay-pay-btn" onClick={handlePayWithRazorpay}>
                Pay ₹{totalPayable.toLocaleString()} via Razorpay 💳
              </Button>
            </div>
          </div>
        </Card>

        {/* Previous Month Payment History */}
        <Card title="📜 Payment History & Receipts" icon="📜" className="history-card">
          {loading ? (
            <p className="loading-text">Loading payment history...</p>
          ) : (payments || []).length === 0 ? (
            <div className="empty-history">
              <p>No previous payment records found.</p>
            </div>
          ) : (
            <div className="payment-table-wrapper">
              <table className="user-payment-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Base Rent</th>
                    <th>Electricity</th>
                    <th>Penalty</th>
                    <th>Total Amount</th>
                    <th>Paid Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(payments || []).map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.month}</strong></td>
                      <td>₹{p.rent_amount || baseRent}</td>
                      <td>₹{p.electricity_charges || 0}</td>
                      <td>₹{p.penalty || 0}</td>
                      <td><strong>₹{p.total_amount || (Number(p.rent_amount || baseRent) + Number(p.electricity_charges || 0))}</strong></td>
                      <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "-"}</td>
                      <td>
                        <span className={`status-pill status-${(p.payment_status || "PENDING").toLowerCase()}`}>
                          {p.payment_status || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
