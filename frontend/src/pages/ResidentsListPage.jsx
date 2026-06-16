import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/ResidentsList.css";
import { useResidents } from "../hooks/useResidents";
import { Input, Select, Alert } from "../components/ui";

const DEFAULT_RESIDENT_FORM = {
  name: "",
  phone: "",
  email: "",
  password: "",
  block_number: "",
  room_number: "",
  room_type: "DOUBLE_SHARE",
  ac_status: "NON_AC",
  photo: null,
  electricity_meter_reading: "",
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
};

export default function ResidentsListPage() {
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_RESIDENT_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { addResident, loading: addingResident, error: addError } = useResidents();

  const fetchResidents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/users");
      if (res.data.success) {
        setResidents(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load residents");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterResidents = useCallback(() => {
    let filtered = residents;
    const normalizedSearch = (searchTerm || "").trim().toLowerCase();

    // Filter by search term
    if (normalizedSearch) {
      filtered = filtered.filter(
        (resident) =>
          [
            resident?.name,
            resident?.phone,
            resident?.number,
            resident?.mobile,
            resident?.email,
            resident?.block_number,
            resident?.room_number
          ].some((value) =>
            String(value ?? "").toLowerCase().includes(normalizedSearch)
          )
      );
    }

    // Filter by block
    if (filterBlock !== "all") {
      filtered = filtered.filter((resident) => resident.block_number === filterBlock);
    }

    setFilteredResidents(filtered);
  }, [residents, searchTerm, filterBlock]);

  useEffect(() => {
    fetchResidents();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") {
      setShowForm(true);
      navigate("/residents-list", { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    filterResidents();
  }, [residents, searchTerm, filterBlock, filterResidents]);

  const handleVacate = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to vacate this resident?")) return;

    try {
      const res = await API.put(`/users/vacate/${id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchResidents();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to vacate resident");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (file) {
        setFormData((prev) => ({ ...prev, [name]: file }));
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

  const resetForm = () => {
    setFormData(DEFAULT_RESIDENT_FORM);
    setPhotoPreview(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const res = await addResident(formData);
    if (res.success) {
      alert("Resident added successfully!");
      setShowForm(false);
      resetForm();
      fetchResidents();
    }
  };

  const uniqueBlocks = [...new Set(residents.map((r) => r.block_number))].sort();

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Residents...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="residents-list-container">
        <div className="residents-list-header">
          <div className="header-left">
            <button onClick={() => navigate("/dashboard")} className="back-btn">
              ← Back to Dashboard
            </button>
            <h2>👥 Resident Details</h2>
            <p>Total Residents: {filteredResidents.length}</p>
          </div>
          <div className="header-right">
            <button
              type="button"
              className="btn btn-primary toggle-form-btn"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                fontWeight: "700",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(102, 126, 234, 0.25)"
              }}
            >
              ➕ Add Resident
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters */}
        <div className="residents-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Block:</label>
            <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)}>
              <option value="all">All Blocks</option>
              {uniqueBlocks.map((block) => (
                <option key={block} value={block}>
                  Block {block}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Residents List */}
        {filteredResidents.length === 0 ? (
          <div className="empty-state">
            <p>No residents found matching your filters.</p>
          </div>
        ) : (
          <div className="residents-table-wrapper">
            <table className="residents-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Join Date</th>
                  <th>Rent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident) => (
                  <tr
                    key={resident.id}
                    onClick={() =>
                      navigate(
                        `/room/${resident.block_number}/${resident.room_number}`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td className="name-cell">
                      <strong>{resident.name}</strong>
                    </td>
                    <td className="block-cell">
                      <span className="block-badge">
                        Block {resident.block_number || "N/A"}
                      </span>
                    </td>
                    <td>Room {resident.room_number || "-"}</td>
                    <td>{resident.phone}</td>
                    <td>{resident.email}</td>
                    <td>
                      {resident.join_date
                        ? new Date(resident.join_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="rent-cell">
                      ₹{resident.rent_amount || 0}
                    </td>
                    <td>
                      <span className={`status-badge status-${resident.status?.toLowerCase()}`}>
                        {resident.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-info"
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/payment-tracking/${resident.id}`
                            );
                          }}
                        >
                          💳
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          title="Edit resident"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-resident/${resident.id}`, {
                              state: { resident },
                            });
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => handleVacate(e, resident.id)}
                          title="Vacate Resident"
                        >
                          🔒
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Backdrop for Add Resident */}
        {showForm && (
          <div className="resident-modal-backdrop" onClick={() => { resetForm(); setShowForm(false); }}>
            <div className="resident-modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="resident-modal-close"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                title="Close"
              >
                ✕
              </button>
              <h3>➕ Add New Resident</h3>
              
              {addError && <Alert>{addError}</Alert>}

              <form className="resident-modal-form" onSubmit={handleAddSubmit}>
                {/* Basic Information */}
                <fieldset>
                  <legend>Basic Information</legend>
                  
                  <div className="form-grid-2col">
                    <Input
                      label="Name *"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      placeholder="Full name"
                    />

                    <Input
                      label="Phone *"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      required
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="form-grid-2col">
                    <Input
                      label="Email *"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      placeholder="Email address"
                    />

                    <Input
                      label="Password *"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required
                      placeholder="Login password"
                    />
                  </div>

                  <div className="form-grid-2col">
                    <Select
                      label="Block Number *"
                      name="block_number"
                      value={formData.block_number}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Block</option>
                      <option value="1">Block 1</option>
                      <option value="2">Block 2</option>
                    </Select>

                    <Input
                      label="Room Number *"
                      type="text"
                      name="room_number"
                      value={formData.room_number}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g., 101, 202"
                    />
                  </div>

                  <div className="form-grid-2col">
                    <Select 
                      label="Room Type *"
                      name="room_type" 
                      value={formData.room_type} 
                      onChange={handleFormChange}
                      required
                    >
                      <option value="SINGLE_SHARE">Single Share</option>
                      <option value="DOUBLE_SHARE">Double Share</option>
                      <option value="TRIPLE_SHARE">Triple Share</option>
                      <option value="FOUR_SHARE">Four Share</option>
                      <option value="FIVE_SHARE">Five Share</option>
                      <option value="SIX_SHARE">Six Share</option>
                    </Select>

                    <Select 
                      label="AC Status *"
                      name="ac_status" 
                      value={formData.ac_status} 
                      onChange={handleFormChange}
                      required
                    >
                      <option value="NON_AC">Non-AC</option>
                      <option value="AC">AC</option>
                    </Select>
                  </div>

                  <div className="form-grid-2col">
                    <Input
                      label="Photo"
                      type="file"
                      name="photo"
                      onChange={handleFormChange}
                      accept="image/*"
                    />

                    <Input
                      label="Electricity Meter Reading"
                      type="number"
                      step="0.01"
                      name="electricity_meter_reading"
                      value={formData.electricity_meter_reading}
                      onChange={handleFormChange}
                      placeholder="Initial meter reading"
                    />
                  </div>

                  {photoPreview && (
                    <div className="photo-preview">
                      <img src={photoPreview} alt="Preview" />
                    </div>
                  )}
                </fieldset>

                {/* Occupation Information */}
                <fieldset>
                  <legend>Occupation</legend>

                  <div className="form-grid-2col">
                    <Select label="Occupation *" name="occupation" value={formData.occupation} onChange={handleFormChange}>
                      <option value="STUDYING">Studying</option>
                      <option value="WORKING">Working</option>
                    </Select>

                    {formData.occupation === "WORKING" ? (
                      <Input
                        label="Company Name"
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleFormChange}
                        placeholder="Company name"
                      />
                    ) : (
                      <Input
                        label="College/University Name"
                        type="text"
                        name="college_name"
                        value={formData.college_name}
                        onChange={handleFormChange}
                        placeholder="College name"
                      />
                    )}
                  </div>
                </fieldset>

                {/* Family Information */}
                <fieldset>
                  <legend>Family & Emergency Contact</legend>

                  <div className="form-grid-2col">
                    <Input
                      label="Father's Name"
                      type="text"
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleFormChange}
                      placeholder="Father's name"
                    />

                    <Input
                      label="Father's Phone"
                      type="tel"
                      name="father_phone"
                      value={formData.father_phone}
                      onChange={handleFormChange}
                      placeholder="Father's phone"
                    />
                  </div>

                  <div className="form-grid-2col">
                    <Input
                      label="Mother's Name"
                      type="text"
                      name="mother_name"
                      value={formData.mother_name}
                      onChange={handleFormChange}
                      placeholder="Mother's name"
                    />

                    <Input
                      label="Guardian Name"
                      type="text"
                      name="guardian_name"
                      value={formData.guardian_name}
                      onChange={handleFormChange}
                      placeholder="Guardian's name"
                    />
                  </div>

                  <div className="form-grid-2col">
                    <Input
                      label="Guardian Phone"
                      type="tel"
                      name="guardian_phone"
                      value={formData.guardian_phone}
                      onChange={handleFormChange}
                      placeholder="Guardian's phone"
                    />

                    <Input
                      label="Emergency Contact Name"
                      type="text"
                      name="emergency_name"
                      value={formData.emergency_name}
                      onChange={handleFormChange}
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div className="form-grid-2col">
                    <Input
                      label="Emergency Contact Phone"
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleFormChange}
                      placeholder="Emergency phone"
                    />
                  </div>
                </fieldset>

                <div className="resident-actions">
                  <button type="submit" className="resident-action-btn primary" disabled={addingResident}>
                    {addingResident ? "Adding..." : "Add Resident"}
                  </button>
                  <button
                    type="button"
                    className="resident-action-btn secondary"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    style={{
                      background: "#edf2f7",
                      color: "#4a5568",
                      border: "1px solid #cbd5e0"
                    }}
                    disabled={addingResident}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
