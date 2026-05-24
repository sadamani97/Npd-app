import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/RoomDetails.css";

export default function RoomDetailsPage() {
  const { blockNumber, roomNumber } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoomDetails();
  }, [blockNumber, roomNumber]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/rooms/${blockNumber}/${roomNumber}`);
      if (res.data.success) {
        setRoomData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load room details");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Room Details...</p>
        </div>
      </Layout>
    );
  }

  if (!roomData) {
    return (
      <Layout>
        <div className="error-message">Room not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="room-details-container">
        <div className="room-details-header">
          <button
            onClick={() => {
              const raw = String(roomData.floor_number ?? "1").trim() || "1";
              const fk = encodeURIComponent(raw);
              navigate(`/block/${encodeURIComponent(blockNumber)}/floor/${fk}`);
            }}
            className="back-btn"
          >
            ← Back to floors / rooms (Block {blockNumber})
          </button>
          <h2>Room {roomData.room_number} - Block {blockNumber}</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="room-details-grid">
          {/* Room Information */}
          <div className="section-card room-info-card">
            <h3>Room Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Room Type:</span>
                <span className="info-value">{roomData.room_type?.replace(/_/g, " ") || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">AC Status:</span>
                <span className="info-value">{roomData.ac_status || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Capacity:</span>
                <span className="info-value">{roomData.capacity || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Base Rent:</span>
                <span className="info-value">₹{roomData.base_rent || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`info-value status-badge ${roomData.status?.toLowerCase()}`}>
                  {roomData.status}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Floor:</span>
                <span className="info-value">{roomData.floor_number || "N/A"}</span>
              </div>
              {roomData.electricity_meter_number && (
                <div className="info-item">
                  <span className="info-label">Electricity Meter:</span>
                  <span className="info-value">{roomData.electricity_meter_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Occupancy */}
          <div className="section-card occupancy-card">
            <h3>Current Occupancy</h3>
            <div className="occupancy-stats">
              <div className="occupancy-stat">
                <span className="occupancy-label">Current:</span>
                <span className="occupancy-value">{roomData.occupancy || 0}</span>
              </div>
              <div className="occupancy-stat">
                <span className="occupancy-label">Capacity:</span>
                <span className="occupancy-value">{roomData.capacity || 0}</span>
              </div>
              <div className="occupancy-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${roomData.capacity > 0 ? ((roomData.occupancy || 0) / roomData.capacity) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Residents List */}
        <div className="section-card residents-card">
          <h3>Residents in This Room</h3>
          {!roomData.residents || roomData.residents.length === 0 ? (
            <div className="empty-state">
              <p>No residents currently in this room</p>
            </div>
          ) : (
            <div className="residents-list">
              {roomData.residents.map((resident) => (
                <div key={resident.id} className="resident-item">
                  <div className="resident-header">
                    <h4 className="resident-name">{resident.name}</h4>
                    <span className="resident-phone">{resident.phone}</span>
                  </div>

                  <div className="resident-info">
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{resident.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Join Date:</span>
                      <span className="info-value">
                        {resident.join_date ? new Date(resident.join_date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Room Type:</span>
                      <span className="info-value">{resident.room_type?.replace(/_/g, " ") || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">AC Status:</span>
                      <span className="info-value">{resident.ac_status || "N/A"}</span>
                    </div>
                  </div>

                  <div className="charges-section">
                    <div className="charge-item">
                      <span className="charge-label">Rent:</span>
                      <span className="charge-value">₹{resident.rent_amount || 0}</span>
                    </div>
                    <div className="charge-item">
                      <span className="charge-label">Electricity:</span>
                      <span className="charge-value">₹{resident.electricity_charges || 0}</span>
                    </div>
                    <div className="charge-item total">
                      <span className="charge-label">Total:</span>
                      <span className="charge-value">₹{resident.total_charges || 0}</span>
                    </div>
                  </div>

                  <button
                    className="view-resident-btn"
                    onClick={() => navigate(`/payment-tracking/${resident.id}`)}
                  >
                    View Payment Details →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
