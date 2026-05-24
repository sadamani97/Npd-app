import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/ResidentsList.css";

export default function ResidentsListPage() {
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchResidents();
  }, []);

  useEffect(() => {
    filterResidents();
  }, [residents, searchTerm, filterBlock]);

  const fetchResidents = async () => {
    try {
      setLoading(true);
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

  const filterResidents = () => {
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
  };

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
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            ← Back to Dashboard
          </button>
          <h2>👥 All Residents</h2>
          <p>Total Residents: {filteredResidents.length}</p>
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
      </div>
    </Layout>
  );
}
