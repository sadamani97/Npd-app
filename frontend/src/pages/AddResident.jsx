import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/Form.css";
import { Button, Input, Alert } from "../components/ui";

export default function AddResident() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    setLoading(true);
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

      const res = await API.post("/users", submitData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (res.data.success) {
        alert("Resident added successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add resident");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="form-card">
        <h2>Add New Resident</h2>

        <Alert>{error}</Alert>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <fieldset>
            <legend>Basic Information</legend>
            
            <div className="form-row">
              <Input
                label="Name *"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Full name"
              />

              <Input
                label="Phone *"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Phone number"
              />
            </div>

            <div className="form-row">
              <Input
                label="Email *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email address"
              />

              <Input
                label="Block Number *"
                type="text"
                name="block_number"
                value={formData.block_number}
                onChange={handleChange}
                required
                placeholder="e.g., A, B, C"
              />
            </div>

            <div className="form-row">
              <Input
                label="Room Number *"
                type="text"
                name="room_number"
                value={formData.room_number}
                onChange={handleChange}
                required
                placeholder="e.g., 101, 202"
              />

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
                <Input
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
                  <Input
                    label="Company Name"
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
                  <Input
                    label="College/University Name"
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
              <Input
                label="Father's Name"
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                placeholder="Father's name"
              />

              <Input
                label="Father's Phone"
                type="tel"
                name="father_phone"
                value={formData.father_phone}
                onChange={handleChange}
                placeholder="Father's phone"
              />
            </div>

            <div className="form-row">
              <Input
                label="Mother's Name"
                type="text"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleChange}
                placeholder="Mother's name"
              />

              <Input
                label="Guardian Name"
                type="text"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
                placeholder="Guardian's name"
              />
            </div>

            <div className="form-row">
              <Input
                label="Guardian Phone"
                type="tel"
                name="guardian_phone"
                value={formData.guardian_phone}
                onChange={handleChange}
                placeholder="Guardian's phone"
              />

              <Input
                label="Emergency Contact Name"
                type="text"
                name="emergency_name"
                value={formData.emergency_name}
                onChange={handleChange}
                placeholder="Emergency contact name"
              />
            </div>

            <div className="form-row">
              <Input
                label="Emergency Contact Phone"
                type="tel"
                name="emergency_phone"
                value={formData.emergency_phone}
                onChange={handleChange}
                placeholder="Emergency phone"
              />
            </div>
          </fieldset>

          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Adding..." : "Add Resident"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/dashboard")}>Cancel</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
