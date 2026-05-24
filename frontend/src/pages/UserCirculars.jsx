import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/UserCirculars.css";

export default function UserCirculars() {
  const navigate = useNavigate();
  const [circulars, setCirculars] = useState([]);
  const [selectedCircular, setSelectedCircular] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, high, normal

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/circulars");
      if (res.data.success) {
        setCirculars(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load circulars");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading circulars...</p>
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
                  {selectedCircular.description}
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

  return (
    <Layout>
      <div className="user-circulars-page">
        <div className="circulars-container">
          <div className="circulars-header">
            <div>
              <button className="back-btn" onClick={() => navigate("/user-dashboard")}>
                ← Back
              </button>
              <h2>📢 Announcements</h2>
              <p className="subtitle">{filteredCirculars.length} announcement(s)</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

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

                  <p className="circular-description">{circular.description}</p>

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
        </div>
      </div>
    </Layout>
  );
}
