import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/PaymentTracking.css";

export default function PaymentTrackingPage() {
  const { residentId } = useParams();
  const [payments, setPayments] = useState([]);
  const [residentData, setResidentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [paymentStats, setPaymentStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (residentId) {
      fetchPaymentHistory();
    } else {
      fetchCurrentMonthPayments();
    }
  }, [residentId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/payments/history/${residentId}`);
      if (res.data.success) {
        setResidentData(res.data.data.user);
        setPayments(res.data.data.payments);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment history");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMonthPayments = async () => {
    try {
      setLoading(true);
      const res = await API.get("/payments/status/current-month");
      if (res.data.success) {
        const paymentData = res.data.data || [];
        setPayments(paymentData);
        
        // Calculate statistics
        const stats = {
          total: paymentData.length,
          paid: paymentData.filter(p => p.payment_status === "PAID").length,
          pending: paymentData.filter(p => p.payment_status === "PENDING").length,
          overdue: paymentData.filter(p => p.payment_status === "OVERDUE").length,
          totalAmount: paymentData.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0),
          paidAmount: paymentData.filter(p => p.payment_status === "PAID").reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0),
          pendingAmount: paymentData.filter(p => ["PENDING", "OVERDUE"].includes(p.payment_status)).reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0)
        };
        setPaymentStats(stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment status");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "status-paid";
      case "PENDING":
        return "status-pending";
      case "OVERDUE":
        return "status-overdue";
      default:
        return "status-unknown";
    }
  };

  const getFilteredPayments = () => {
    if (filterStatus === "all") return payments;
    return payments.filter(p => p.payment_status === filterStatus.toUpperCase());
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Payment Data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="payment-tracking-container">
        <div className="payment-header">
          {residentId ? (
            <button onClick={() => window.history.back()} className="back-btn">
              ← Back
            </button>
          ) : null}
          <h2>💳 Payment Tracking & Analysis</h2>
          {residentData && (
            <p className="resident-info">
              Resident: {residentData.name} | Block {residentData.block} | Room {residentData.room}
            </p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* For individual resident */}
        {residentId ? (
          <div className="payment-details-page">
            {/* Current Charges Summary */}
            <div className="charges-summary-card">
              <h3>🧾 Monthly Charges</h3>
              <div className="charges-grid">
                <div className="charge-box">
                  <span className="charge-label">Rent Amount</span>
                  <span className="charge-amount">₹{residentData?.rent_amount || 0}</span>
                </div>
                <div className="charge-box">
                  <span className="charge-label">Electricity</span>
                  <span className="charge-amount">₹{residentData?.electricity_charges || 0}</span>
                </div>
                <div className="charge-box total">
                  <span className="charge-label">Total Due</span>
                  <span className="charge-amount">₹{(parseFloat(residentData?.rent_amount || 0) + parseFloat(residentData?.electricity_charges || 0)).toFixed(2)}</span>
                </div>
              </div>
              <p className="payment-deadline">
                ⏱️ Payment Deadline: 10th of every month
              </p>
            </div>

            {/* Payment History */}
            <div className="payment-history-card">
              <h3>📋 Payment History</h3>
              {payments.length === 0 ? (
                <div className="empty-state">
                  <p>No payment records found</p>
                </div>
              ) : (
                <div className="payment-table-wrapper">
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Rent</th>
                        <th>Electricity</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, idx) => (
                        <tr key={idx} className={getStatusColor(payment.payment_status)}>
                          <td className="month-cell">{payment.month}</td>
                          <td>₹{payment.rent_amount || 0}</td>
                          <td>₹{payment.electricity_amount || 0}</td>
                          <td className="amount-cell">₹{payment.amount}</td>
                          <td>
                            <span className={`status-badge ${getStatusColor(payment.payment_status)}`}>
                              {payment.payment_status}
                            </span>
                          </td>
                          <td>
                            {payment.paid_date
                              ? new Date(payment.paid_date).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* For all residents payment status */
          <div className="all-residents-payments">
            {/* Payment Summary Cards */}
            <div className="payment-summary">
              <div className="summary-card summary-total">
                <div className="summary-icon">👥</div>
                <div className="summary-content">
                  <div className="summary-value">{paymentStats.total}</div>
                  <div className="summary-label">Total Residents</div>
                </div>
              </div>

              <div className="summary-card summary-paid">
                <div className="summary-icon">✅</div>
                <div className="summary-content">
                  <div className="summary-value">{paymentStats.paid}</div>
                  <div className="summary-label">Paid</div>
                  <div className="summary-amount">₹{paymentStats.paidAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="summary-card summary-pending">
                <div className="summary-icon">⏳</div>
                <div className="summary-content">
                  <div className="summary-value">{paymentStats.pending}</div>
                  <div className="summary-label">Pending</div>
                  <div className="summary-amount">₹{paymentStats.pendingAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="summary-card summary-overdue">
                <div className="summary-icon">⚠️</div>
                <div className="summary-content">
                  <div className="summary-value">{paymentStats.overdue}</div>
                  <div className="summary-label">Overdue</div>
                  <div className="summary-amount">₹{paymentStats.pendingAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="payment-filters">
              <button
                className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
                onClick={() => setFilterStatus("all")}
              >
                All ({paymentStats.total})
              </button>
              <button
                className={`filter-btn ${filterStatus === "paid" ? "active" : ""}`}
                onClick={() => setFilterStatus("paid")}
              >
                Paid ({paymentStats.paid})
              </button>
              <button
                className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
                onClick={() => setFilterStatus("pending")}
              >
                Pending ({paymentStats.pending})
              </button>
              <button
                className={`filter-btn ${filterStatus === "overdue" ? "active" : ""}`}
                onClick={() => setFilterStatus("overdue")}
              >
                Overdue ({paymentStats.overdue})
              </button>
            </div>

            {getFilteredPayments().length === 0 ? (
              <div className="empty-state">
                <p>No payments found for this filter</p>
              </div>
            ) : (
              <div className="residents-payment-grid">
                {getFilteredPayments().map((resident, idx) => (
                  <div key={idx} className={`resident-payment-card ${getStatusColor(resident.payment_status)}`}>
                    <div className="card-header">
                      <h4>{resident.name}</h4>
                      <span className={`status-badge ${getStatusColor(resident.payment_status)}`}>
                        {resident.payment_status}
                      </span>
                    </div>

                    <div className="card-body">
                      <div className="resident-info-item">
                        <span className="label">Block/Room:</span>
                        <span className="value">
                          Block {resident.block_number} / Room {resident.room_number}
                        </span>
                      </div>
                      <div className="resident-info-item">
                        <span className="label">Phone:</span>
                        <span className="value">{resident.phone}</span>
                      </div>
                      <div className="resident-info-item">
                        <span className="label">Amount Due:</span>
                        <span className="value amount">₹{resident.payment_amount || 0}</span>
                      </div>
                      <div className="resident-info-item">
                        <span className="label">Due Date:</span>
                        <span className="value">
                          {resident.due_date ? new Date(resident.due_date).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      {resident.paid_date && (
                        <div className="resident-info-item">
                          <span className="label">Paid On:</span>
                          <span className="value">
                            {new Date(resident.paid_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      className="view-details-btn"
                      onClick={() => navigate(`/payment-tracking/${resident.id}`)}
                    >
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
