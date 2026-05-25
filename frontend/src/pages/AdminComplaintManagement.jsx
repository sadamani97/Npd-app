import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/AdminComplaintManagement.css";
import { Button, Alert } from "../components/ui";

export default function AdminComplaintManagement() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, open, in_progress, resolved
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    // Check if user is admin
    if (user.role !== "ADMIN") {
      navigate("/user-dashboard");
      return;
    }
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/complaints");
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredComplaints = () => {
    if (filter === "all") return complaints;
    return complaints.filter((c) => c.status === filter.toUpperCase());
  };

  const handleStatusUpdate = async (complaintId, status) => {
    setUpdating(true);
    try {
      const res = await API.put(`/complaints/${complaintId}`, { status });
      if (res.data.success) {
        fetchComplaints();
        setSelectedComplaint(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update complaint");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "status-open";
      case "IN_PROGRESS":
        return "status-progress";
      case "RESOLVED":
        return "status-resolved";
      default:
        return "";
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      MAINTENANCE: "🔧",
      CLEANLINESS: "🧹",
      FOOD: "🍽️",
      NOISE: "🔊",
      OTHER: "📝"
    };
    return icons[category] || "📝";
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading complaints...</p>
        </div>
      </Layout>
    );
  }

  if (selectedComplaint) {
    return (
      <Layout>
        <div className="complaint-detail-view">
              <div className="detail-header">
                <Button className="back-btn" variant="secondary" onClick={() => setSelectedComplaint(null)}>
                  ← Back to List
                </Button>
              </div>

          <div className="complaint-detail-card">
            <div className="detail-header-section">
              <div className="title-section">
                <span className="category-icon">
                  {getCategoryIcon(selectedComplaint.category)}
                </span>
                <div>
                  <h1>{selectedComplaint.title}</h1>
                  <p className="subcategory">{selectedComplaint.category}</p>
                </div>
              </div>
              <span className={`status-badge ${getStatusColor(selectedComplaint.status)}`}>
                {selectedComplaint.status}
              </span>
            </div>

            <div className="detail-user-info">
              <h3>👤 Submitted By</h3>
              <div className="user-details">
                <p>
                  <strong>Name:</strong> {selectedComplaint.User?.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedComplaint.User?.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedComplaint.User?.phone}
                </p>
                <p>
                  <strong>Room:</strong> Block {selectedComplaint.User?.block_number}, Floor{" "}
                  {selectedComplaint.User?.floor_number}, Room {selectedComplaint.User?.room_number}
                </p>
              </div>
            </div>

            <div className="detail-content">
              <h3>📋 Complaint Details</h3>
              <div className="description-text">
                {selectedComplaint.description}
              </div>

              <div className="detail-meta">
                <p>
                  <strong>Date Submitted:</strong>{" "}
                  {new Date(selectedComplaint.createdAt).toLocaleString()}
                </p>
                {selectedComplaint.updatedAt && selectedComplaint.createdAt !== selectedComplaint.updatedAt && (
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(selectedComplaint.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="status-update-section">
              <h3>🔄 Update Status</h3>
              <div className="status-options">
                <Button
                  className={`status-option ${selectedComplaint.status === "OPEN" ? "active" : ""}`}
                  variant="secondary"
                  onClick={() => handleStatusUpdate(selectedComplaint.id, "OPEN")}
                  disabled={updating}
                >
                  Open
                </Button>
                <Button
                  className={`status-option ${selectedComplaint.status === "IN_PROGRESS" ? "active" : ""}`}
                  variant="secondary"
                  onClick={() => handleStatusUpdate(selectedComplaint.id, "IN_PROGRESS")}
                  disabled={updating}
                >
                  In Progress
                </Button>
                <Button
                  className={`status-option ${selectedComplaint.status === "RESOLVED" ? "active" : ""}`}
                  variant="secondary"
                  onClick={() => handleStatusUpdate(selectedComplaint.id, "RESOLVED")}
                  disabled={updating}
                >
                  Resolved
                </Button>
              </div>
              {updating && <p className="updating-message">Updating...</p>}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredComplaints = getFilteredComplaints();

  return (
    <Layout>
      <div className="admin-complaints-page">
        <div className="complaints-container">
          <div className="complaints-header">
            <div>
              <button className="back-btn" onClick={() => navigate("/dashboard")}>
                ← Back
              </button>
              <h2>📝 Complaint Management</h2>
              <p className="subtitle">Total: {complaints.length} complaints</p>
            </div>
          </div>

          <Alert>{error}</Alert>

          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Open</div>
              <div className="stat-number">
                {complaints.filter((c) => c.status === "OPEN").length}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">In Progress</div>
              <div className="stat-number">
                {complaints.filter((c) => c.status === "IN_PROGRESS").length}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Resolved</div>
              <div className="stat-number">
                {complaints.filter((c) => c.status === "RESOLVED").length}
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="filter-buttons">
            <Button className={`filter-btn ${filter === "all" ? "active" : ""}`} variant="secondary" onClick={() => setFilter("all")}>All ({complaints.length})</Button>
            <Button className={`filter-btn ${filter === "open" ? "active" : ""}`} variant="secondary" onClick={() => setFilter("open")}>Open ({complaints.filter((c) => c.status === "OPEN").length})</Button>
            <Button className={`filter-btn ${filter === "in_progress" ? "active" : ""}`} variant="secondary" onClick={() => setFilter("in_progress")}>In Progress ({complaints.filter((c) => c.status === "IN_PROGRESS").length})</Button>
            <Button className={`filter-btn ${filter === "resolved" ? "active" : ""}`} variant="secondary" onClick={() => setFilter("resolved")}>Resolved ({complaints.filter((c) => c.status === "RESOLVED").length})</Button>
          </div>

          {/* Complaints Table */}
          {filteredComplaints.length > 0 ? (
            <div className="complaints-table-container">
              <table className="complaints-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td>
                        <div className="cell-title">
                          <span>{complaint.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-cell">
                          {getCategoryIcon(complaint.category)} {complaint.category}
                        </span>
                      </td>
                      <td>
                        <div className="cell-user">
                          <p>{complaint.User?.name}</p>
                          <small>{complaint.User?.room_number}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="cell-date">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Button className="action-btn" variant="secondary" onClick={() => setSelectedComplaint(complaint)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No complaints to display</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
