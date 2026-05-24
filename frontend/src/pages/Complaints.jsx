import React, { useState, useEffect } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/Complaints.css";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtering, setFiltering] = useState("ALL");
  const user = getCurrentUser();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await API.get("/complaints");
      
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await API.put(`/complaints/${id}/status`, { status: newStatus });
      
      if (res.data.success) {
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update complaint");
    }
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;

    try {
      const res = await API.delete(`/complaints/${id}`);
      
      if (res.data.success) {
        fetchComplaints();
        alert("Complaint deleted");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete complaint");
    }
  };

  const filteredComplaints = filtering === "ALL" 
    ? complaints 
    : complaints.filter(c => c.status === filtering);

  return (
    <Layout>
      <div className="complaints-header">
        <h2>Resident Complaints</h2>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filtering === "ALL" ? "active" : ""}`}
            onClick={() => setFiltering("ALL")}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filtering === "OPEN" ? "active" : ""}`}
            onClick={() => setFiltering("OPEN")}
          >
            Open
          </button>
          <button 
            className={`filter-btn ${filtering === "IN_PROGRESS" ? "active" : ""}`}
            onClick={() => setFiltering("IN_PROGRESS")}
          >
            In Progress
          </button>
          <button 
            className={`filter-btn ${filtering === "RESOLVED" ? "active" : ""}`}
            onClick={() => setFiltering("RESOLVED")}
          >
            Resolved
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading complaints...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-state">
          <p>No complaints found</p>
        </div>
      ) : (
        <div className="complaints-grid">
          {filteredComplaints.map((complaint) => (
            <div key={complaint.id} className="complaint-card">
              <div className="complaint-header">
                <h3>{complaint.title}</h3>
                <span className={`status-badge status-${complaint.status.toLowerCase()}`}>
                  {complaint.status}
                </span>
              </div>

              <div className="complaint-body">
                <p className="category">
                  <strong>Category:</strong> {complaint.category}
                </p>
                <p className="description">{complaint.description}</p>
                
                {complaint.User && (
                  <p className="resident-info">
                    <strong>From:</strong> {complaint.User.name} ({complaint.User.phone})
                  </p>
                )}

                <p className="date">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </p>
              </div>

              {user.role === "ADMIN" && (
                <div className="complaint-actions">
                  {complaint.status !== "RESOLVED" && (
                    <select 
                      value={complaint.status}
                      onChange={(e) => updateStatus(complaint.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  )}
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteComplaint(complaint.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
