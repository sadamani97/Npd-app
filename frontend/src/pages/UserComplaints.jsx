import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/UserComplaints.css";
import { Button, Input, Select, Textarea, Alert } from "../components/ui";

export default function UserComplaints() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // list or form
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "OTHER"
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await API.post("/complaints", formData);
      if (res.data.success) {
        setSuccessMessage("✅ Complaint registered successfully!");
        setFormData({
          title: "",
          description: "",
          category: "OTHER"
        });
        fetchComplaints();

        setTimeout(() => {
          setView("list");
          setSuccessMessage("");
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
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

  if (loading && view === "list") {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading complaints...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-complaints-page">
        {view === "list" ? (
          <div className="complaints-list-container">
            <div className="complaints-header">
              <div>
                <Button className="back-btn" variant="secondary" onClick={() => navigate("/user-dashboard") }>
                  ← Back
                </Button>
                <h2>📝 My Complaints</h2>
              </div>
              <Button className="new-complaint-btn" variant="primary" onClick={() => setView("form") }>
                + New Complaint
              </Button>
            </div>

            <Alert>{error}</Alert>

            {complaints.length > 0 ? (
              <div className="complaints-grid">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="complaint-card">
                    <div className="complaint-header">
                      <div className="complaint-title-section">
                        <span className="category-icon">
                          {getCategoryIcon(complaint.category)}
                        </span>
                        <h3>{complaint.title}</h3>
                      </div>
                      <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                        {complaint.status || "OPEN"}
                      </span>
                    </div>

                    <p className="complaint-description">{complaint.description}</p>

                    <div className="complaint-meta">
                      <span className="category">
                        <strong>Category:</strong> {complaint.category}
                      </span>
                      <span className="date">
                        <strong>Date:</strong>{" "}
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {complaint.updatedAt && complaint.createdAt !== complaint.updatedAt && (
                      <div className="complaint-updated">
                        <strong>Last Updated:</strong>{" "}
                        {new Date(complaint.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No complaints yet</p>
                <Button className="primary-btn" variant="primary" onClick={() => setView("form")}> 
                  Create Your First Complaint
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="complaint-form-container">
            <div className="form-header">
              <Button className="back-btn" variant="secondary" onClick={() => setView("list") }>
                ← Back to List
              </Button>
              <h2>📝 New Complaint</h2>
            </div>

            <Alert>{error}</Alert>
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form onSubmit={handleSubmitComplaint} className="complaint-form">
              <Input
                label="Complaint Title"
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Brief title of your complaint..."
                required
                maxLength={100}
              />
              <small>{formData.title.length}/100</small>

              <Select
                label="Category"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                required
              >
                <option value="MAINTENANCE">🔧 Maintenance</option>
                <option value="CLEANLINESS">🧹 Cleanliness</option>
                <option value="FOOD">🍽️ Food</option>
                <option value="NOISE">🔊 Noise</option>
                <option value="OTHER">📝 Other</option>
              </Select>

              <Textarea
                label="Description"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Describe your complaint in detail..."
                required
                rows={6}
                maxLength={500}
              />
              <small>{formData.description.length}/500</small>

              <Button
                type="submit"
                disabled={submitting || !formData.title || !formData.description}
                className="submit-btn"
                variant="primary"
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>

            <div className="form-info">
              <h4>📋 Guidelines</h4>
              <ul>
                <li>Be specific and detailed in your complaint description</li>
                <li>Provide relevant dates and times if applicable</li>
                <li>Admin will review and take appropriate action</li>
                <li>You'll be notified of any updates to your complaint</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
