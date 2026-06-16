import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/ManageRooms.css";
import { Button, Input, Select, Alert } from "../components/ui";

const ROOM_TYPE_OPTIONS = [
  { value: "SINGLE_SHARE", label: "Single Sharing", capacity: 1 },
  { value: "DOUBLE_SHARE", label: "Double Sharing", capacity: 2 },
  { value: "TRIPLE_SHARE", label: "Triple Sharing", capacity: 3 },
  { value: "FOUR_SHARE", label: "Four Sharing", capacity: 4 },
  { value: "FIVE_SHARE", label: "Five Sharing", capacity: 5 },
  { value: "SIX_SHARE", label: "Six Sharing", capacity: 6 }
];

const DEFAULT_ROOM_FORM = {
  block_number: "1",
  floor_number: "1",
  room_number: "",
  room_type: "DOUBLE_SHARE",
  ac_status: "NON_AC",
  is_premium: false,
  capacity: 2,
  base_rent: "",
  electricity_meter_number: ""
};

const compareNumbers = (a, b) =>
  String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });

const calculateSuggestedRent = (roomType, acStatus, isPremium) => {
  const rentMap = {
    SINGLE_SHARE: { AC: 10500, NON_AC: 9500, PREMIUM: 20000 },
    DOUBLE_SHARE: { AC: 7750, NON_AC: 7000, PREMIUM: 15000 },
    TRIPLE_SHARE: { AC: 7500, NON_AC: 6750, PREMIUM: 10000 },
    FOUR_SHARE: { AC: 7250, NON_AC: 6500 },
    FIVE_SHARE: { NON_AC: 6250 },
    SIX_SHARE: { NON_AC: 6000 }
  };

  const selected = rentMap[roomType] || {};
  if (isPremium) return selected.PREMIUM || selected.AC || selected.NON_AC || 0;
  if (acStatus === "AC") return selected.AC || selected.NON_AC || 0;
  return selected.NON_AC || 0;
};

export default function ManageRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(DEFAULT_ROOM_FORM);
  const [editRoomId, setEditRoomId] = useState(null);
  const [filterBlock, setFilterBlock] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError("");
      const blocksResult = await API.get("/rooms/blocks");
      const blocks = blocksResult?.data?.data || [];

      const roomResponses = await Promise.all(
        blocks.map((block) => API.get(`/rooms/block/${encodeURIComponent(block.block_number)}`))
      );

      const allRooms = roomResponses.flatMap((response) => response?.data?.data || []);
      setRooms(allRooms);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const blocks = ["1", "2"];

  const visibleRooms = useMemo(() => {
    const list = filterBlock === "all"
      ? rooms
      : rooms.filter((room) => String(room.block_number) === String(filterBlock));
    return list.slice().sort((a, b) => {
      const blockCompare = compareNumbers(a.block_number, b.block_number);
      if (blockCompare) return blockCompare;
      const floorCompare = compareNumbers(a.floor_number, b.floor_number);
      if (floorCompare) return floorCompare;
      return compareNumbers(a.room_number, b.room_number);
    });
  }, [rooms, filterBlock]);

  const resetForm = () => {
    setEditRoomId(null);
    setFormData(DEFAULT_ROOM_FORM);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "room_type") {
      const selectedType = ROOM_TYPE_OPTIONS.find((option) => option.value === value);
      const suggestedRent = calculateSuggestedRent(value, formData.ac_status, formData.is_premium);
      setFormData((prev) => ({
        ...prev,
        room_type: value,
        capacity: selectedType?.capacity || prev.capacity,
        base_rent: prev.base_rent ? prev.base_rent : String(suggestedRent)
      }));
      return;
    }

    if (name === "ac_status") {
      const suggestedRent = calculateSuggestedRent(formData.room_type, value, formData.is_premium);
      setFormData((prev) => ({
        ...prev,
        ac_status: value,
        base_rent: prev.base_rent ? prev.base_rent : String(suggestedRent)
      }));
      return;
    }

    if (name === "is_premium") {
      const nextPremium = type === "checkbox" ? checked : value === "true";
      const suggestedRent = calculateSuggestedRent(formData.room_type, formData.ac_status, nextPremium);
      setFormData((prev) => ({
        ...prev,
        is_premium: nextPremium,
        base_rent: prev.base_rent ? prev.base_rent : String(suggestedRent)
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");

      const payload = {
        block_number: formData.block_number,
        floor_number: formData.floor_number,
        room_number: formData.room_number,
        room_type: formData.room_type,
        ac_status: formData.ac_status,
        is_premium: formData.is_premium,
        capacity: Number(formData.capacity),
        base_rent: Number(formData.base_rent || 0),
        electricity_meter_number: formData.electricity_meter_number
      };

      if (editRoomId) {
        await API.put(`/rooms/${editRoomId}`, payload);
      } else {
        await API.post("/rooms", payload);
      }

      resetForm();
      setShowForm(false);
      await fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (room) => {
    setEditRoomId(room.id);
    setShowForm(true);
    setFormData({
      block_number: String(room.block_number || "1"),
      floor_number: String(room.floor_number || "1"),
      room_number: String(room.room_number || ""),
      room_type: room.room_type || "DOUBLE_SHARE",
      ac_status: room.ac_status || "NON_AC",
      is_premium: Boolean(room.is_premium),
      capacity: Number(room.capacity || 2),
      base_rent: String(room.base_rent || 0),
      electricity_meter_number: room.electricity_meter_number || ""
    });
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete Room ${room.room_number} in Block ${room.block_number}?`)) return;
    try {
      await API.delete(`/rooms/${room.id}`);
      if (editRoomId === room.id) {
        resetForm();
      }
      await fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete room");
    }
  };

  return (
    <Layout>
      <div className="manage-rooms-page">
        <div className="manage-rooms-header">
          <div className="header-left">
            <Button type="button" className="back-btn" variant="secondary" onClick={() => navigate("/blocks") }>
              ← Back to Blocks
            </Button>
            <h2>Manage Rooms</h2>
            <p className="header-subtitle">Add, edit, and delete room details for all blocks.</p>
          </div>
          <div className="header-right">
            <Button
              type="button"
              variant="primary"
              className="toggle-form-btn"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              ➕ Add New Room
            </Button>
          </div>
        </div>

        <Alert>{error}</Alert>

        <div className="manage-rooms-container">
          {/* List Card (Main Directory) */}
          <div className="manage-rooms-grid-section">
            <div className="manage-rooms-list">
              <div className="manage-rooms-list-header">
                <h3>🗂️ Room Directory</h3>
                <div className="filter-wrapper">
                  <span className="filter-label">Filter:</span>
                  <Select
                    className="filter-select"
                    name="filterBlock"
                    value={filterBlock}
                    onChange={(event) => setFilterBlock(event.target.value)}
                  >
                    <option value="all">All Blocks</option>
                    {blocks.map((block) => (
                      <option key={block} value={block}>
                        Block {block}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="rooms-loading-state">
                  <div className="spinner"></div>
                  <p>Loading rooms directory...</p>
                </div>
              ) : visibleRooms.length === 0 ? (
                <div className="rooms-empty-state">
                  <p>No rooms matching filters were found in the database.</p>
                </div>
              ) : (
                <div className="rooms-card-grid">
                  {visibleRooms.map((room) => {
                    const isAc = room.ac_status === "AC";
                    const isPrem = room.is_premium;

                    return (
                      <div key={room.id} className={`room-card-item ${isPrem ? 'premium' : ''} ${isAc ? 'ac-room' : 'non-ac-room'}`}>
                        {isPrem && <span className="premium-badge">★ Premium</span>}
                        <div className="room-card-header">
                          <span className="room-title">Room {room.room_number}</span>
                          <span className={`room-ac-badge ${isAc ? 'ac' : 'non-ac'}`}>
                            {isAc ? "❄ AC" : "Standard"}
                          </span>
                        </div>

                        <div className="room-card-body">
                          <div className="room-info-row">
                            <span className="info-icon">🏢</span>
                            <span className="info-text">Block {room.block_number} • Floor {room.floor_number}</span>
                          </div>
                          <div className="room-info-row">
                            <span className="info-icon">👥</span>
                            <span className="info-text" style={{ textTransform: "capitalize" }}>
                              {String(room.room_type || "").replace(/_/g, " ").toLowerCase()}
                            </span>
                          </div>
                          <div className="room-info-row">
                            <span className="info-icon">🛏️</span>
                            <span className="info-text">Capacity: {room.capacity} beds</span>
                          </div>
                          {room.electricity_meter_number && (
                            <div className="room-info-row">
                              <span className="info-icon">⚡</span>
                              <span className="info-text">Meter: {room.electricity_meter_number}</span>
                            </div>
                          )}
                        </div>

                        <div className="room-card-footer">
                          <div className="price-tag">
                            <span className="price-val">₹{room.base_rent || 0}</span>
                            <span className="price-sub">/bed</span>
                          </div>
                          <div className="room-card-actions">
                            <Button
                              type="button"
                              className="action-icon-btn edit"
                              variant="secondary"
                              title="Edit Room"
                              onClick={() => startEdit(room)}
                            >
                              ✏️
                            </Button>
                            <Button
                              type="button"
                              className="action-icon-btn delete"
                              variant="secondary"
                              title="Delete Room"
                              onClick={() => handleDelete(room)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Centered Modal Backdrop for Room Creation/Edition */}
        {showForm && (
          <div className="room-modal-backdrop" onClick={() => { resetForm(); setShowForm(false); }}>
            <div className="room-modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="room-modal-close"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                title="Close"
              >
                ✕
              </button>
              <h3>{editRoomId ? "✏️ Edit Room Details" : "➕ Create New Room"}</h3>
              <form className="manage-rooms-form" onSubmit={handleSubmit}>
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Block</label>
                    <Select
                      name="block_number"
                      value={formData.block_number}
                      onChange={handleChange}
                      required
                    >
                      {blocks.map((block) => (
                        <option key={block} value={block}>
                          Block {block}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="form-group">
                    <label>Floor</label>
                    <Input
                      type="text"
                      name="floor_number"
                      value={formData.floor_number}
                      onChange={handleChange}
                      placeholder="Floor"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Room Number</label>
                    <Input
                      type="text"
                      name="room_number"
                      value={formData.room_number}
                      onChange={handleChange}
                      placeholder="Room No."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Room Type</label>
                    <Select
                      name="room_type"
                      value={formData.room_type}
                      onChange={handleChange}
                      required
                    >
                      {ROOM_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>AC Status</label>
                    <Select
                      name="ac_status"
                      value={formData.ac_status}
                      onChange={handleChange}
                      required
                    >
                      <option value="NON_AC">Non-AC</option>
                      <option value="AC">AC</option>
                    </Select>
                  </div>

                  <div className="form-group">
                    <label>Capacity</label>
                    <Input
                      type="number"
                      min="1"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      placeholder="Capacity"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Rent Amount (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    name="base_rent"
                    value={formData.base_rent}
                    onChange={handleChange}
                    placeholder="Rent amount per bed"
                  />
                </div>

                <div className="form-group">
                  <label>Electricity Meter Number</label>
                  <Input
                    type="text"
                    name="electricity_meter_number"
                    value={formData.electricity_meter_number}
                    onChange={handleChange}
                    placeholder="Meter number (optional)"
                  />
                </div>

                <div className="form-group toggle-switch-container">
                  <span className="toggle-label">Premium Room Status</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="is_premium"
                      checked={formData.is_premium}
                      onChange={handleChange}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="manage-rooms-actions">
                  <Button type="submit" className="room-action-btn primary" variant="primary" disabled={saving}>
                    {saving ? "Saving..." : editRoomId ? "Update Details" : "Add Room"}
                  </Button>
                  <Button
                    type="button"
                    className="room-action-btn secondary"
                    variant="secondary"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
