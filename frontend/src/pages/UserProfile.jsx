import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await API.get(`/users/${storedUser.id}`);
      
      if (res.data.success) {
        setUser(res.data.data);
        setFormData(res.data.data);
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await API.put(`/users/${user.id}`, formData);
      
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem("user", JSON.stringify(res.data.data));
        setIsEditing(false);
        setError("");
        // Show success message (you can add toast here)
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-profile-container">
        <div className="profile-header">
          <h2>👤 My Profile</h2>
          <p className="subtitle">Manage your account information</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {user && (
          <div className="profile-card">
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  disabled
                  className="form-input disabled"
                />
                <small className="form-hint">Cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>
            </div>

            <div className="profile-section">
              <h3>Hostel Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Block Number</label>
                  <input
                    type="text"
                    name="block_number"
                    value={formData.block_number || ""}
                    disabled
                    className="form-input disabled"
                  />
                </div>
                <div className="form-group">
                  <label>Room Number</label>
                  <input
                    type="text"
                    name="room_number"
                    value={formData.room_number || ""}
                    disabled
                    className="form-input disabled"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Room Type</label>
                <input
                  type="text"
                  name="room_type"
                  value={formData.room_type || ""}
                  disabled
                  className="form-input disabled"
                />
              </div>
            </div>

            <div className="profile-section">
              <h3>Emergency Contacts</h3>
              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_name"
                  value={formData.emergency_name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="btn-edit">
                    ✏️ Edit Profile
                  </button>
                  <button onClick={handleLogout} className="btn-logout">
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} disabled={loading} className="btn-save">
                    {loading ? "Saving..." : "💾 Save Changes"}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(user);
                    }} 
                    className="btn-cancel"
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
