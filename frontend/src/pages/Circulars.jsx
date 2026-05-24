import React, { useState, useEffect } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/Circulars.css";

export default function Circulars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    sentVia: "WHATSAPP"
  });

  const user = getCurrentUser();

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      setLoading(true);
      const res = await API.get("/circulars");
      
      if (res.data.success) {
        setCirculars(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load circulars");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/circulars", formData);
      
      if (res.data.success) {
        // Show detailed feedback about send results
        const { stats } = res.data;
        if (stats && stats.failureCount > 0) {
          alert(`Circular sent!\n✅ Delivered to ${stats.successCount} users\n⚠️ Failed to send to ${stats.failureCount} users\n\nCheck server logs for failed numbers.`);
        } else {
          alert("Circular sent successfully to all residents!");
        }
        setFormData({ title: "", message: "", sentVia: "WHATSAPP" });
        setShowForm(false);
        fetchCirculars();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send circular");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCircular = async (id) => {
    if (!window.confirm("Are you sure you want to delete this circular?")) return;

    try {
      const res = await API.delete(`/circulars/${id}`);
      
      if (res.data.success) {
        fetchCirculars();
        alert("Circular deleted");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete circular");
    }
  };

  return (
    <Layout>
      <div className="circulars-header">
        <h2>Important Circulars</h2>
        {user.role === "ADMIN" && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "📢 Send Circular"}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Send Circular Form */}
      {showForm && user.role === "ADMIN" && (
        <div className="circular-form-container">
          <form onSubmit={handleSubmit} className="circular-form">
            <h3>Send Important Message</h3>

            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter subject"
                required
              />
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter your message"
                rows="6"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label>Send Via</label>
              <select name="sentVia" value={formData.sentVia} onChange={handleChange}>
                <option value="WHATSAPP">📱 WhatsApp (Fastest - but requires Twilio setup)</option>
                <option value="EMAIL">📧 Email (Recommended - Gmail SMTP, quick to setup)</option>
                <option value="BOTH">📱📧 Both (WhatsApp + Email to all residents)</option>
              </select>
              <small style={{color: '#666', marginTop: '8px', display: 'block'}}>
                💡 First-time? Use <strong>Email</strong> - it's already configured for instant setup!
              </small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send to All Residents"}
            </button>
          </form>
        </div>
      )}

      {/* Circulars List */}
      {loading && !showForm ? (
        <div className="loading">Loading circulars...</div>
      ) : circulars.length === 0 ? (
        <div className="empty-state">
          <p>No circulars sent yet</p>
        </div>
      ) : (
        <div className="circulars-list">
          {circulars.map((circular) => (
            <div key={circular.id} className="circular-item">
              <div className="circular-item-header">
                <h3>{circular.title}</h3>
                <span className={`status-badge status-${circular.status.toLowerCase()}`}>
                  {circular.status}
                </span>
              </div>

              <p className="circular-message">{circular.message}</p>

              <div className="circular-meta">
                <span>📱 {circular.sentVia}</span>
                <span>📅 {new Date(circular.sentAt).toLocaleDateString()}</span>
              </div>

              {user.role === "ADMIN" && (
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteCircular(circular.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
