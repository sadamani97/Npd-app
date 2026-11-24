import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCirculars } from "../hooks/useCirculars";
import { usePayments } from "../hooks/usePayments";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import "../styles/UserCirculars.css";

export default function UserCirculars() {
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const { circulars, fetchCirculars, loading: circLoading, error: circError } = useCirculars();
  const { payments, fetchUserPayments, loading: payLoading, error: payError } = usePayments();

  const [activeTab, setActiveTab] = useState("announcements"); // 'announcements' | 'updates'
  const [selectedCircular, setSelectedCircular] = useState(null);
  const [filter, setFilter] = useState("all"); // all, high, normal

  useEffect(() => {
    fetchCirculars();
    if (user && user.id) {
      fetchUserPayments(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = circLoading || payLoading;
  const error = circError || payError;

  const getFilteredCirculars = () => {
    if (filter === "all") return circulars;
    if (filter === "high") return circulars.filter((c) => c.priority === "HIGH");
    if (filter === "normal") return circulars.filter((c) => c.priority !== "HIGH");
    return circulars;
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "HIGH":
        return <span className="priority-badge high">🔴 High Priority</span>;
      case "MEDIUM":
        return <span className="priority-badge medium">🟡 Medium Priority</span>;
      case "LOW":
        return <span className="priority-badge low">🟢 Low Priority</span>;
      default:
        return <span className="priority-badge normal">Normal</span>;
    }
  };

  // Compile "Recent Updates" list
  const getRecentUpdates = () => {
    const updates = [];

    // 1. Add all Circulars as updates
    (circulars || []).forEach((c) => {
      updates.push({
        id: `circular-${c.id}`,
        type: "ANNOUNCEMENT",
        icon: c.title.includes("Food") ? "🍽️" : "📢",
        title: c.title,
        message: c.message,
        date: new Date(c.createdAt),
        priority: c.priority,
        raw: c
      });
    });

    // 2. Add Rent Generated & Reminders from Payment records
    (payments || []).forEach((p) => {
      const monthDate = new Date(p.month + "-02T00:00:00");
      const monthName = monthDate.toLocaleString("default", { month: "long", year: "numeric" });
      const createdDate = p.createdAt ? new Date(p.createdAt) : monthDate;

      // Rent Generated update
      updates.push({
        id: `rent-gen-${p.id}`,
        type: "RENT_INVOICE",
        icon: "✉️",
        title: `Rent Invoice Generated - ${monthName}`,
        message: `Your rent bill of ₹${(Number(p.rent_amount) + Number(p.electricity_amount)).toLocaleString()} for ${monthName} has been generated. Base Rent: ₹${Number(p.rent_amount).toLocaleString()}, Electricity: ₹${Number(p.electricity_amount).toLocaleString()}. Status: ${p.payment_status}.`,
        date: createdDate
      });

      // Rent Reminder if status is PENDING
      if (p.payment_status === "PENDING") {
        const today = new Date();
        const isOverdue = today.getDate() > 10 && today.getMonth() === monthDate.getMonth() && today.getFullYear() === monthDate.getFullYear();
        updates.push({
          id: `rent-remind-${p.id}`,
          type: "RENT_REMINDER",
          icon: "💳",
          title: isOverdue ? `⚠️ Rent Overdue Warning - ${monthName}` : `📅 Rent Payment Reminder - ${monthName}`,
          message: isOverdue
            ? `Your payment for ${monthName} is overdue past the 10th. A late fee penalty of ₹100/day accumulates daily. Please pay ₹${(Number(p.amount || 0)).toLocaleString()} immediately.`
            : `Please pay your rent of ₹${(Number(p.amount || 0)).toLocaleString()} for ${monthName} before the 10th to avoid late fees.`,
          date: today > monthDate ? today : monthDate,
          priority: isOverdue ? "HIGH" : "NORMAL"
        });
      }
    });

    // Sort all updates by date descending
    return updates.sort((a, b) => b.date - a.date);
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </Layout>
    );
  }

  if (selectedCircular) {
    return (
      <Layout>
        <div className="circulars-detail-view">
          <div className="detail-header">
            <button className="back-btn" onClick={() => setSelectedCircular(null)}>
              ← Back to List
            </button>
          </div>

          <div className="circular-detail-card">
            <div className="detail-header-section">
              <div>
                <h1>{selectedCircular.title}</h1>
                <div className="detail-meta">
                  {getPriorityBadge(selectedCircular.priority)}
                  <span className="date">
                    📅 {new Date(selectedCircular.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-content">
              <div className="description-section">
                <h3>📌 Details</h3>
                <div className="description-text">
                  {selectedCircular.message}
                </div>
              </div>

              {selectedCircular.created_by && (
                <div className="created-by">
                  <strong>Created by:</strong> Admin
                </div>
              )}

              {selectedCircular.updatedAt && (
                <div className="updated-date">
                  <strong>Last Updated:</strong>{" "}
                  {new Date(selectedCircular.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredCirculars = getFilteredCirculars();
  const recentUpdates = getRecentUpdates();

  return (
    <Layout>
      <div className="user-circulars-page">
        <div className="circulars-container">
          <div className="circulars-header" style={{ marginBottom: "20px" }}>
            <div>
              <button className="back-btn" onClick={() => navigate("/user-dashboard")}>
                ← Back to Dashboard
              </button>
              <h2>📢 Notification & Updates Center</h2>
              <p className="subtitle">Stay updated with food menus, circulars, and rent updates</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Toggle Tabs */}
          <div className="circular-tabs" style={{ display: "flex", gap: "10px", marginBottom: "25px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
            <button
              onClick={() => setActiveTab("announcements")}
              style={{
                padding: "10px 20px",
                fontWeight: "700",
                fontSize: "14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: activeTab === "announcements" ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "#f1f5f9",
                color: activeTab === "announcements" ? "#ffffff" : "#475569",
                transition: "all 0.2s ease"
              }}
            >
              📢 Announcements ({circulars.length})
            </button>
            <button
              onClick={() => setActiveTab("updates")}
              style={{
                padding: "10px 20px",
                fontWeight: "700",
                fontSize: "14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: activeTab === "updates" ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "#f1f5f9",
                color: activeTab === "updates" ? "#ffffff" : "#475569",
                transition: "all 0.2s ease"
              }}
            >
              🔔 Recent Updates ({recentUpdates.length})
            </button>
          </div>

          {activeTab === "announcements" ? (
            <>
              {/* Filter Buttons */}
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All Announcements ({circulars.length})
                </button>
                <button
                  className={`filter-btn ${filter === "high" ? "active" : ""}`}
                  onClick={() => setFilter("high")}
                >
                  High Priority ({circulars.filter((c) => c.priority === "HIGH").length})
                </button>
              </div>

              {filteredCirculars.length > 0 ? (
                <div className="circulars-grid">
                  {filteredCirculars.map((circular) => (
                    <div
                      key={circular.id}
                      className={`circular-card ${circular.priority === "HIGH" ? "high-priority" : ""}`}
                      onClick={() => setSelectedCircular(circular)}
                    >
                      <div className="circular-card-header">
                        <h3>{circular.title}</h3>
                        {getPriorityBadge(circular.priority)}
                      </div>

                      <p className="circular-description">{circular.message}</p>

                      <div className="circular-footer">
                        <span className="date">
                          📅 {new Date(circular.createdAt).toLocaleDateString()}
                        </span>
                        <span className="read-more">Read More →</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No announcements to display</p>
                </div>
              )}
            </>
          ) : (
            /* Recent Updates View */
            <div className="recent-updates-timeline" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {recentUpdates.length > 0 ? (
                recentUpdates.map((update) => (
                  <div
                    key={update.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "20px",
                      display: "flex",
                      gap: "15px",
                      alignItems: "flex-start",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      borderLeft: update.priority === "HIGH" ? "5px solid #ef4444" : "5px solid #6366f1"
                    }}
                  >
                    <span style={{ fontSize: "24px", lineHeight: "1" }}>{update.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", alignItems: "baseline" }}>
                        <h4 style={{ margin: "0", fontSize: "16px", color: "#1e293b", fontWeight: "700" }}>{update.title}</h4>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{update.date.toLocaleString()}</span>
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{update.message}</p>
                      
                      {update.type === "ANNOUNCEMENT" && (
                        <button
                          onClick={() => setSelectedCircular(update.raw)}
                          style={{
                            marginTop: "12px",
                            background: "none",
                            border: "none",
                            color: "#4338ca",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            padding: "0"
                          }}
                        >
                          Read full announcement →
                        </button>
                      )}
                      
                      {(update.type === "RENT_INVOICE" || update.type === "RENT_REMINDER") && (
                        <button
                          onClick={() => navigate("/user-payments")}
                          style={{
                            marginTop: "12px",
                            background: "none",
                            border: "none",
                            color: "#4338ca",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            padding: "0"
                          }}
                        >
                          View dues & Pay online →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: "40px", textAlign: "center", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <p style={{ color: "#64748b" }}>No recent updates available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
