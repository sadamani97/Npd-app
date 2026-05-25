import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/Dashboard.css";
import { Button, Alert } from "../components/ui";

export default function Dashboard() {
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState({
    totalResidents: 0,
    blockGroups: [],
    roomOccupancy: [],
    roomStats: {
      totalRooms: 0,
      occupiedRooms: 0,
      vacantRooms: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("stats"); // stats, residents, blocks
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const { activeView: viewFromNav, dashboardRefresh } = location.state || {};
    if (viewFromNav === "residents") {
      setActiveView("residents");
    }
    if (dashboardRefresh != null) {
      fetchData();
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      try {
        const resRes = await API.get("/users");
        if (resRes.data.success) {
          setResidents(resRes.data.data);
        }
      } catch (err) {
        console.error("Residents fetch error:", err);
      }

      try {
        const statsRes = await API.get("/dashboard/stats");
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    } catch (err) {
      setError("Failed to load dashboard data. Please refresh the page.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVacate = async (id) => {
    if (!window.confirm("Are you sure you want to vacate this resident?")) return;

    try {
      const res = await API.put(`/users/vacate/${id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to vacate resident");
    }
  };

  // Click handlers to navigate to detail pages
  const handleBlockClick = (blockNumber) => {
    navigate(`/block/${blockNumber}`);
  };

  const handleRoomClick = () => {
    navigate("/rooms-occupancy");
  };

  const getBlockStats = () => {
    return stats.blockGroups || [];
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasActiveSearch = normalizedSearch.length > 0;
  const matchesSearch = (value) =>
    String(value ?? "").toLowerCase().includes(normalizedSearch);

  /** occupied / capacity / vacancy for a room row from dashboard stats */
  const roomVacancyMetrics = (room) => {
    const occupied = Number(room.occupied || 0);
    const capacity = Number(room.capacity || 0);
    const vacancyRaw =
      room.vacancy != null && room.vacancy !== ""
        ? Number(room.vacancy)
        : NaN;
    const vacancy = Number.isFinite(vacancyRaw)
      ? vacancyRaw
      : Math.max(capacity - occupied, 0);
    return { occupied, capacity, vacancy };
  };

  /** Vacant rooms only — blocks with no vacancies are omitted */
  const getVacantRoomsByBlock = () => {
    const blocks = {};
    (stats.roomOccupancy || []).forEach((room) => {
      const { occupied, capacity, vacancy } = roomVacancyMetrics(room);
      if (vacancy <= 0) return;
      if (
        hasActiveSearch &&
        ![
          room.block_number,
          `block ${room.block_number}`,
          room.room_number,
          `room ${room.room_number}`,
          room.phone,
          room.mobile,
          occupied,
          capacity,
          vacancy
        ].some(matchesSearch)
      ) {
        return;
      }

      const bn = room.block_number;
      if (!blocks[bn]) {
        blocks[bn] = [];
      }
      blocks[bn].push(room);
    });
    return blocks;
  };

  const filteredResidents = hasActiveSearch
    ? residents.filter((resident) =>
        [
          resident?.name,
          resident?.phone,
          resident?.number,
          resident?.mobile,
          resident?.email,
          resident?.status,
          resident?.block_number,
          resident?.room_number
        ].some(matchesSearch)
      )
    : residents;

  const filteredBlockStats = hasActiveSearch
    ? getBlockStats().filter((block) =>
        [block?.block, `block ${block?.block}`, block?.residents].some(matchesSearch)
      )
    : getBlockStats();

  const filteredVacantRoomsByBlock = getVacantRoomsByBlock();

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>Hostel Management Dashboard</h2>
          <p className="header-subtitle">Welcome back, {user.name}!</p>
        </div>
        <div className="dashboard-search">
          <input
            type="text"
            placeholder="Search name, phone, block, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dashboard-search-input"
          />
        </div>
      </div>

      <Alert>{error}</Alert>

      {/* Main Stats Cards - Now Clickable */}
      <div className="stats-container">
        <div className="stat-card stat-primary" onClick={() => navigate("/residents-list")} style={{cursor: "pointer"}}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalResidents}</div>
            <div className="stat-label">Total Residents</div>
          </div>
        </div>

        <div className="stat-card stat-info" onClick={() => navigate("/blocks")} style={{cursor: "pointer"}}>
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <div className="stat-value">{stats.blockGroups?.length || 0}</div>
            <div className="stat-label">Blocks</div>
          </div>
        </div>

        <div className="stat-card stat-success" onClick={handleRoomClick} style={{cursor: "pointer"}}>
          <div className="stat-icon">🛏️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.roomStats?.occupiedRooms || 0}</div>
            <div className="stat-label">Rooms Occupied</div>
          </div>
        </div>
      </div>

      {/* View Toggle Buttons */}
      <div className="view-toggle">
        <Button
          variant="secondary"
          className={`toggle-btn ${activeView === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveView('stats')}
        >
          📈 Block Statistics
        </Button>
        <Button
          variant="secondary"
          className={`toggle-btn ${activeView === 'blocks' ? 'active' : ''}`}
          onClick={() => setActiveView('blocks')}
        >
          🏗️ Vacant rooms
        </Button>
        <Button
          variant="secondary"
          className={`toggle-btn ${activeView === 'residents' ? 'active' : ''}`}
          onClick={() => setActiveView('residents')}
        >
          👨‍👩‍👧‍👦 Residents List
        </Button>
      </div>

      {/* Block Statistics View */}
      {activeView === 'stats' && (
        <div className="section-card">
          <h3>📊 Block-wise Resident Distribution</h3>
          {filteredBlockStats.length === 0 ? (
            <div className="empty-state">
              <p>
                {hasActiveSearch
                  ? `No block data found for "${searchTerm}".`
                  : "No resident data available"}
              </p>
            </div>
          ) : (
            <div className="block-grid">
              {filteredBlockStats.map((block, idx) => (
                <div
                  key={idx}
                  className={`block-card ${block.block === "Not Assigned" ? "" : "clickable"}`}
                  onClick={() => block.block !== "Not Assigned" && handleBlockClick(block.block)}
                >
                  <div className="block-header">
                    <span className="block-name">Block {block.block || "N/A"}</span>
                    <span className="block-badge">{block.residents} residents</span>
                  </div>
                  <div className="block-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${(block.residents / (stats.totalResidents || 1)) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="block-stats">
                    <span>Occupancy: {Math.round((block.residents / (stats.totalResidents || 1)) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Room Vacancy View — vacant rooms only */}
      {activeView === 'blocks' && (
        <div className="section-card">
          <h3>🛏️ Vacant rooms by block</h3>
          <p style={{ margin: "0 0 16px", color: "#7f8c8d", fontSize: "14px" }}>
            Showing rooms that still have at least one vacant bed (not fully occupied).
          </p>
          {Object.keys(filteredVacantRoomsByBlock).length === 0 ? (
            <div className="empty-state">
              <p>
                {hasActiveSearch
                  ? `No vacant room data found for "${searchTerm}".`
                  : "No vacant rooms right now."}
              </p>
            </div>
          ) : (
            <div className="room-sections">
              {Object.entries(filteredVacantRoomsByBlock).map(([block, rooms]) => (
                <div key={block} className="room-section">
                  <h4 className="room-section-title">Block {block}</h4>
                  <div className="rooms-grid">
                    {rooms.map((room, idx) => {
                      const { occupied, capacity, vacancy } = roomVacancyMetrics(room);

                      return (
                      <div key={idx} className="room-item vacant">
                        <div className="room-number">
                          Room {room.room_number}
                        </div>
                        <div className="room-occupancy">
                          <span className="occupancy-badge">
                            {capacity > 0 ? `${occupied}/${capacity}` : occupied} occupied
                          </span>
                          <span className="vacancy-badge">{vacancy} vacant</span>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Residents Table View */}
      {activeView === 'residents' && (
        <div className="section-card">
          <h3>👨‍👩‍👧‍👦 All Residents</h3>
          {filteredResidents.length === 0 ? (
            <div className="empty-state">
              <p>
                {hasActiveSearch ? (
                  `No residents found for "${searchTerm}".`
                ) : (
                  <>No residents found. <a href="/add-resident">Add a resident</a></>
                )}
              </p>
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((resident) => (
                    <tr key={resident.id}>
                      <td className="name-cell">
                        <strong>{resident.name}</strong>
                      </td>
                      <td className="block-cell">
                        <span className="block-badge-table">Block {resident.block_number || "N/A"}</span>
                      </td>
                      <td>Room {resident.room_number || "-"}</td>
                      <td>{resident.phone}</td>
                      <td>{resident.email}</td>
                      <td>
                        <span className={`status-badge status-${resident.status?.toLowerCase()}`}>
                          {resident.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            type="button"
                            variant="secondary"
                            className="btn-sm btn-info"
                            title="Room & occupancy"
                            onClick={() => {
                              const b = resident.block_number;
                              const r = resident.room_number;
                              if (b && r) {
                                navigate(
                                  `/room/${encodeURIComponent(b)}/${encodeURIComponent(r)}`
                                );
                              } else {
                                alert("Assign block and room before opening room details.");
                              }
                            }}
                          >
                            👁️
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="btn-sm btn-secondary"
                            title="Edit resident"
                            onClick={() =>
                              navigate(`/edit-resident/${resident.id}`, {
                                state: { resident },
                              })
                            }
                          >
                            ✏️
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="btn-sm btn-danger"
                            onClick={() => handleVacate(resident.id)}
                            title="Vacate Resident"
                          >
                            🔒
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

