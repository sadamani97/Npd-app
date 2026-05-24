import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/Form.css";

export default function EditResident() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    block_number: "",
    room_number: "",
    room_type: "DOUBLE_SHARE",
    ac_status: "NON_AC",
    photo: null,
    father_name: "",
    father_phone: "",
    mother_name: "",
    emergency_name: "",
    emergency_phone: "",
    guardian_name: "",
    guardian_phone: "",
    occupation: "STUDYING",
    company_name: "",
    college_name: ""
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResidentData();
  }, [id]);

  const fetchResidentData = async () => {
    try {
      setLoading(true);
      // Get resident data from state if available
      if (location.state && location.state.resident) {
        const resident = location.state.resident;
        setFormData({
          name: resident.name || "",
          phone: resident.phone || "",
          email: resident.email || "",
          block_number: resident.block_number || "",
          room_number: resident.room_number || "",
          room_type: resident.room_type || "DOUBLE_SHARE",
          ac_status: resident.ac_status || "NON_AC",
          photo: null,
          father_name: resident.father_name || "",
          father_phone: resident.father_phone || "",
          mother_name: resident.mother_name || "",
          emergency_name: resident.emergency_name || "",
          emergency_phone: resident.emergency_phone || "",
          guardian_name: resident.guardian_name || "",
          guardian_phone: resident.guardian_phone || "",
          occupation: resident.occupation || "STUDYING",
          company_name: resident.company_name || "",
          college_name: resident.college_name || ""
        });
        if (resident.photo) {
          setPhotoPreview(resident.photo);
        }
      } else {
        // Fallback: fetch from API
        const res = await API.get(`/users/${id}`);
        if (res.data.success) {
          const resident = res.data.data;
          setFormData({
            name: resident.name || "",
            phone: resident.phone || "",
            email: resident.email || "",
            block_number: resident.block_number || "",
            room_number: resident.room_number || "",
            room_type: resident.room_type || "DOUBLE_SHARE",
            ac_status: resident.ac_status || "NON_AC",
            photo: null,
            father_name: resident.father_name || "",
            father_phone: resident.father_phone || "",
            mother_name: resident.mother_name || "",
            emergency_name: resident.emergency_name || "",
            emergency_phone: resident.emergency_phone || "",
            guardian_name: resident.guardian_name || "",
            guardian_phone: resident.guardian_phone || "",
            occupation: resident.occupation || "STUDYING",
            company_name: resident.company_name || "",
            college_name: resident.college_name || ""
          });
          if (resident.photo) {
            setPhotoPreview(resident.photo);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resident details");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      const file = files[0];
      if (file) {
        setFormData((prev) => ({ ...prev, [name]: file }));
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (key === "photo" && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== "photo") {
          submitData.append(key, formData[key]);
        }
      });

      const res = await API.put(`/users/${id}`, submitData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (res.data.success) {
        alert("Resident updated successfully!");
        navigate("/dashboard", {
          state: {
            activeView: "residents",
            dashboardRefresh: Date.now(),
          },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update resident");
      console.error("Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Resident Details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="form-card">
        <h2>Edit Resident</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <fieldset>
            <legend>Basic Information</legend>
            
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email address"
                />
              </div>

              <div className="form-group">
                <label>Block Number *</label>
                <input
                  type="text"
                  name="block_number"
                  value={formData.block_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., A, B, C"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Room Number *</label>
                <input
                  type="text"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 101, 202"
                />
              </div>

              <div className="form-group">
                <label>Room Type *</label>
                <select 
                  name="room_type" 
                  value={formData.room_type} 
                  onChange={handleChange}
                  required
                >
                  <option value="SINGLE_SHARE">Single Share</option>
                  <option value="DOUBLE_SHARE">Double Share</option>
                  <option value="TRIPLE_SHARE">Triple Share</option>
                  <option value="FOUR_SHARE">Four Share</option>
                  <option value="FIVE_SHARE">Five Share</option>
                  <option value="SIX_SHARE">Six Share</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>AC Status *</label>
                <select 
                  name="ac_status" 
                  value={formData.ac_status} 
                  onChange={handleChange}
                  required
                >
                  <option value="AC">AC</option>
                  <option value="NON_AC">Non-AC</option>
                </select>
              </div>

              <div className="form-group">
                <label>Photo</label>
                <input
                  type="file"
                  name="photo"
                  onChange={handleChange}
                  accept="image/*"
                  placeholder="Upload resident photo"
                />
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" style={{ maxWidth: "100px", marginTop: "10px", borderRadius: "5px" }} />
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          {/* Occupation Information */}
          <fieldset>
            <legend>Occupation</legend>

            <div className="form-row">
              <div className="form-group">
                <label>Occupation *</label>
                <select name="occupation" value={formData.occupation} onChange={handleChange}>
                  <option value="STUDYING">Studying</option>
                  <option value="WORKING">Working</option>
                </select>
              </div>

              {formData.occupation === "WORKING" && (
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>
              )}

              {formData.occupation === "STUDYING" && (
                <div className="form-group">
                  <label>College/University Name</label>
                  <input
                    type="text"
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleChange}
                    placeholder="College name"
                  />
                </div>
              )}
            </div>
          </fieldset>

          {/* Family Information */}
          <fieldset>
            <legend>Family Information</legend>

            <div className="form-row">
              <div className="form-group">
                <label>Father's Name</label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  placeholder="Father's name"
                />
              </div>

              <div className="form-group">
                <label>Father's Phone</label>
                <input
                  type="tel"
                  name="father_phone"
                  value={formData.father_phone}
                  onChange={handleChange}
                  placeholder="Father's phone"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mother's Name</label>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  placeholder="Mother's name"
                />
              </div>

              <div className="form-group">
                <label>Guardian Name</label>
                <input
                  type="text"
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  placeholder="Guardian's name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Guardian Phone</label>
                <input
                  type="tel"
                  name="guardian_phone"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  placeholder="Guardian's phone"
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_name"
                  value={formData.emergency_name}
                  onChange={handleChange}
                  placeholder="Emergency contact name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  placeholder="Emergency phone"
                />
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Updating..." : "Update Resident"}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
