import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResidents } from "../hooks/useResidents";
import { useRooms } from "../hooks/useRooms";
import { usePayments } from "../hooks/usePayments";
import Layout from "../components/Layout";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/Dashboard.css";
import { Button, Alert } from "../components/ui";
import API from "../services/api";

const block1MonthlyData = [
  { month: "Jan", newResidents: 8, vacatedResidents: 2, totalResidents: 38, occupiedRooms: 20, vacantRooms: 5, totalRooms: 25, newLeads: 80, siteVisits: 50, registrations: 25, joinedResidents: 8 },
  { month: "Feb", newResidents: 5, vacatedResidents: 3, totalResidents: 40, occupiedRooms: 21, vacantRooms: 4, totalRooms: 25, newLeads: 70, siteVisits: 40, registrations: 20, joinedResidents: 5 },
  { month: "Mar", newResidents: 10, vacatedResidents: 4, totalResidents: 46, occupiedRooms: 23, vacantRooms: 2, totalRooms: 25, newLeads: 90, siteVisits: 60, registrations: 30, joinedResidents: 10 },
  { month: "Apr", newResidents: 6, vacatedResidents: 5, totalResidents: 47, occupiedRooms: 24, vacantRooms: 1, totalRooms: 25, newLeads: 75, siteVisits: 45, registrations: 22, joinedResidents: 6 },
  { month: "May", newResidents: 12, vacatedResidents: 3, totalResidents: 56, occupiedRooms: 24, vacantRooms: 1, totalRooms: 25, newLeads: 110, siteVisits: 75, registrations: 40, joinedResidents: 12 },
  { month: "Jun", newResidents: 7, vacatedResidents: 4, totalResidents: 59, occupiedRooms: 24, vacantRooms: 1, totalRooms: 25, newLeads: 85, siteVisits: 55, registrations: 28, joinedResidents: 7 }
];

const block2MonthlyData = [
  { month: "Jan", newResidents: 4, vacatedResidents: 2, totalResidents: 12, occupiedRooms: 6, vacantRooms: 19, totalRooms: 25, newLeads: 40, siteVisits: 20, registrations: 10, joinedResidents: 4 },
  { month: "Feb", newResidents: 4, vacatedResidents: 3, totalResidents: 13, occupiedRooms: 7, vacantRooms: 18, totalRooms: 25, newLeads: 45, siteVisits: 22, registrations: 11, joinedResidents: 4 },
  { month: "Mar", newResidents: 5, vacatedResidents: 1, totalResidents: 17, occupiedRooms: 9, vacantRooms: 16, totalRooms: 25, newLeads: 50, siteVisits: 25, registrations: 15, joinedResidents: 5 },
  { month: "Apr", newResidents: 3, vacatedResidents: 2, totalResidents: 18, occupiedRooms: 10, vacantRooms: 15, totalRooms: 25, newLeads: 35, siteVisits: 18, registrations: 8, joinedResidents: 3 },
  { month: "May", newResidents: 8, vacatedResidents: 4, totalResidents: 22, occupiedRooms: 12, vacantRooms: 13, totalRooms: 25, newLeads: 70, siteVisits: 38, registrations: 20, joinedResidents: 8 },
  { month: "Jun", newResidents: 5, vacatedResidents: 2, totalResidents: 25, occupiedRooms: 14, vacantRooms: 11, totalRooms: 25, newLeads: 55, siteVisits: 30, registrations: 14, joinedResidents: 5 }
];

export default function Dashboard({ defaultActiveView = null }) {
  const { residents, fetchResidents, vacateResident, loading: residentsLoading, error: residentsError } = useResidents();
  const { stats, fetchDashboardStats, loading: statsLoading, error: statsError } = useRooms();
  const { payments, fetchCurrentMonthPayments, loading: paymentsLoading, error: paymentsError } = usePayments();
  const [activeView, setActiveView] = useState(defaultActiveView); // stats, residents, blocks, analytics
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Jun");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState("All");
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredLine, setHoveredLine] = useState(null);
  const [foodCount, setFoodCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const loading = residentsLoading || statsLoading || paymentsLoading;
  const error = residentsError || statsError || paymentsError;

  const unpaidCount = payments?.filter(p => p.payment_status === "PENDING" || p.payment_status === "OVERDUE").length || 0;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const { activeView: viewFromNav, dashboardRefresh } = location.state || {};
    if (viewFromNav) {
      setActiveView(viewFromNav);
    }
    if (dashboardRefresh != null) {
      fetchData();
    }
  }, [location.state]);

  const fetchFoodCount = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await API.get(`/food-confirmations/admin/by-date?confirmation_date=${today}`);
      if (res.data && res.data.success) {
        setFoodCount(res.data.count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch food count", err);
    }
  };

  const fetchData = async () => {
    await Promise.allSettled([
      fetchResidents(),
      fetchDashboardStats(),
      fetchCurrentMonthPayments(),
      fetchFoodCount()
    ]);
  };

  const handleVacate = async (id) => {
    if (!window.confirm("Are you sure you want to vacate this resident?")) return;

    const res = await vacateResident(id);
    if (res.success) {
      alert(res.message);
      fetchData();
    } else {
      alert(res.message || "Failed to vacate resident");
    }
  };

  // Click handlers to navigate to detail pages
  const handleBlockClick = (blockNumber) => {
    navigate(`/block/${blockNumber}`);
  };

  const handleRoomClick = () => {
    navigate("/rooms-occupancy");
  };

  const getMergedData = () => {
    const b1List = block1MonthlyData.map(d => ({ ...d }));
    const b2List = block2MonthlyData.map(d => ({ ...d }));

    const b1ResidentsLive = (stats.blockGroups || []).find(b => String(b.block) === "1")?.residents || 9;
    const b2ResidentsLive = (stats.blockGroups || []).find(b => String(b.block) === "2")?.residents || 1;
    
    const b1Rooms = (stats.roomOccupancy || []).filter(r => String(r.block_number) === "1");
    const b1OccupiedRooms = b1Rooms.filter(r => Number(r.occupied) > 0).length;
    const b1TotalRooms = b1Rooms.length || 10;
    const b1VacantRooms = Math.max(b1TotalRooms - b1OccupiedRooms, 0);

    const b2Rooms = (stats.roomOccupancy || []).filter(r => String(r.block_number) === "2");
    const b2OccupiedRooms = b2Rooms.filter(r => Number(r.occupied) > 0).length;
    const b2TotalRooms = b2Rooms.length || 10;
    const b2VacantRooms = Math.max(b2TotalRooms - b2OccupiedRooms, 0);

    if (b1List[5]) {
      b1List[5].totalResidents = b1ResidentsLive;
      b1List[5].occupiedRooms = b1OccupiedRooms || b1List[5].occupiedRooms;
      b1List[5].vacantRooms = b1VacantRooms || b1List[5].vacantRooms;
      b1List[5].totalRooms = b1TotalRooms || b1List[5].totalRooms;
    }
    if (b2List[5]) {
      b2List[5].totalResidents = b2ResidentsLive;
      b2List[5].occupiedRooms = b2OccupiedRooms || b2List[5].occupiedRooms;
      b2List[5].vacantRooms = b2VacantRooms || b2List[5].vacantRooms;
      b2List[5].totalRooms = b2TotalRooms || b2List[5].totalRooms;
    }

    return { b1List, b2List };
  };

  const getFilteredData = () => {
    const { b1List, b2List } = getMergedData();
    if (selectedBlockFilter === "1") return b1List;
    if (selectedBlockFilter === "2") return b2List;

    return b1List.map((m1, idx) => {
      const m2 = b2List[idx];
      return {
        month: m1.month,
        newResidents: m1.newResidents + m2.newResidents,
        vacatedResidents: m1.vacatedResidents + m2.vacatedResidents,
        totalResidents: m1.totalResidents + m2.totalResidents,
        occupiedRooms: m1.occupiedRooms + m2.occupiedRooms,
        vacantRooms: m1.vacantRooms + m2.vacantRooms,
        totalRooms: m1.totalRooms + m2.totalRooms,
        newLeads: m1.newLeads + m2.newLeads,
        siteVisits: m1.siteVisits + m2.siteVisits,
        registrations: m1.registrations + m2.registrations,
        joinedResidents: m1.joinedResidents + m2.joinedResidents
      };
    });
  };

  const handleExportCSV = () => {
    const data = getFilteredData();
    const headers = [
      "Month",
      "New Residents",
      "Vacated Residents",
      "Net Growth",
      "Total Residents",
      "Occupied Rooms",
      "Vacant Rooms",
      "Occupancy Rate",
      "New Leads",
      "Site Visits",
      "Registrations",
      "Joined Residents",
      "Lead Conversion Rate",
      "Visit Conversion Rate"
    ];

    const rows = data.map(m => {
      const net = m.newResidents - m.vacatedResidents;
      const occupancy = m.totalRooms > 0 ? `${Math.round((m.occupiedRooms / m.totalRooms) * 100)}%` : "0%";
      const leadConv = m.newLeads > 0 ? `${Math.round((m.joinedResidents / m.newLeads) * 100)}%` : "0%";
      const visitConv = m.siteVisits > 0 ? `${Math.round((m.joinedResidents / m.siteVisits) * 100)}%` : "0%";
      
      return [
        m.month,
        m.newResidents,
        m.vacatedResidents,
        net,
        m.totalResidents,
        m.occupiedRooms,
        m.vacantRooms,
        occupancy,
        m.newLeads,
        m.siteVisits,
        m.registrations,
        m.joinedResidents,
        leadConv,
        visitConv
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Hostel_Growth_Insights_Block_${selectedBlockFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBlockStats = () => {
    return (stats.blockGroups || []).filter(
      (block) => String(block.block) === "1" || String(block.block) === "2"
    );
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

  const totalVacantBeds = (stats.roomOccupancy || []).reduce((sum, room) => sum + (room.vacancy || 0), 0);
  const totalBeds = (stats.roomOccupancy || []).reduce((sum, room) => sum + (room.capacity || 0), 0);

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

      {!activeView && (
        <>
          {/* View Toggle Buttons */}
          <div className="view-toggle" style={{ justifyContent: "center", marginBottom: "20px" }}>
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
        <Button
          variant="secondary"
          className={`toggle-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          📊 Growth Insights
        </Button>
      </div>

      {/* Main Stats Cards - Now Clickable */}
      <div className="stats-container" style={{ justifyContent: "center", display: "flex", flexWrap: "wrap", gap: "20px" }}>
        <div className="stat-card stat-primary" onClick={() => navigate("/residents-list")} style={{cursor: "pointer", flex: "1", minWidth: "200px", maxWidth: "250px"}}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalResidents}</div>
            <div className="stat-label">Total Residents</div>
          </div>
        </div>

        <div className="stat-card stat-info" onClick={() => navigate("/blocks")} style={{cursor: "pointer", flex: "1", minWidth: "200px", maxWidth: "250px"}}>
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <div className="stat-value">{getBlockStats().length}</div>
            <div className="stat-label">Blocks</div>
          </div>
        </div>

        <div className="stat-card stat-success" onClick={() => setActiveView('blocks')} style={{cursor: "pointer", flex: "1", minWidth: "200px", maxWidth: "250px"}}>
          <div className="stat-icon">🛏️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.roomStats?.vacantRooms || 0}</div>
            <div className="stat-label">Vacant Rooms</div>
          </div>
        </div>

        <div className="stat-card stat-warning" onClick={() => navigate("/unpaid-residents")} style={{cursor: "pointer", flex: "1", minWidth: "200px", maxWidth: "250px"}}>
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className="stat-value">{unpaidCount}</div>
            <div className="stat-label">Pending Payments</div>
          </div>
        </div>
      </div>

      {/* Overview Interactive Graph Section */}
      <div className="overview-graph-section">
        <h3 className="overview-title">Dashboard Overview</h3>
        <div className="overview-cards">
          <div className="overview-card glass-panel">
            <div className="overview-card-header">
              <h4>Total Vacant Beds</h4>
              <span className="overview-icon">🛏️</span>
            </div>
            <div className="overview-value">{totalVacantBeds}</div>
            <div className="overview-bar">
              <div className="overview-bar-fill vacant-fill" style={{ width: `${Math.min((totalVacantBeds / (totalBeds || 1)) * 100, 100)}%` }}></div>
            </div>
            <p className="overview-subtext">Across all blocks</p>
          </div>
          
          <div className="overview-card glass-panel">
            <div className="overview-card-header">
              <h4>Food Count (Today)</h4>
              <span className="overview-icon">🍽️</span>
            </div>
            <div className="overview-value">{foodCount}</div>
            <div className="overview-bar">
              <div className="overview-bar-fill food-fill" style={{ width: `${Math.min((foodCount / (stats.totalResidents || 1)) * 100, 100)}%` }}></div>
            </div>
            <p className="overview-subtext">Confirmed daily requirements.</p>
          </div>
          
          <div className="overview-card glass-panel">
            <div className="overview-card-header">
              <h4>Monthly Growth</h4>
              <span className="overview-icon">🚀</span>
            </div>
            <div className="overview-value">+12%</div>
            <div className="overview-chart-mock">
               <svg viewBox="0 0 100 30" className="sparkline">
                 <path d="M0,25 L20,20 L40,22 L60,10 L80,15 L100,5" fill="none" stroke="url(#sparkGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                 <defs>
                   <linearGradient id="sparkGradient" x1="0" y1="0" x2="1" y2="0">
                     <stop offset="0%" stopColor="#4facfe" />
                     <stop offset="100%" stopColor="#00f2fe" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
            <p className="overview-subtext">Compared to last month</p>
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="quick-access-section">
        <h3 className="overview-title" style={{ marginTop: '20px' }}>Quick Access</h3>
        <div className="quick-access-container">
          <div className="quick-access-btn" onClick={() => navigate("/manage-rooms")}>
            <div className="qa-icon" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>🛏️</div>
            <span>Book a Room</span>
          </div>
          <div className="quick-access-btn" onClick={() => navigate("/complaints")}>
            <div className="qa-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>🎟️</div>
            <span>Issue Ticket</span>
          </div>
          <div className="quick-access-btn" onClick={() => navigate("/food-menu-management")}>
            <div className="qa-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>🍛</div>
            <span>Food Menu</span>
          </div>
          <div className="quick-access-btn" onClick={() => navigate("/circulars")}>
            <div className="qa-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>📢</div>
            <span>Create a Circular</span>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Inline Detailed Views */}
      {activeView && (
        <div className="active-view-page" style={{ animation: "fadeIn 0.4s ease" }}>
          <Button onClick={() => setActiveView(null)} variant="secondary" style={{ marginBottom: "20px" }}>
            ← Back to Dashboard
          </Button>

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
                      
                      const isFullyEmpty = occupied === 0;
                      const isNearlyFull = vacancy === 1;
                      
                      let badgeClass = "vacancy-pill-badge partial-room";
                      let badgeText = `${vacancy} Vacant`;
                      let cardClass = "room-item vacant";
                      
                      if (isFullyEmpty) {
                        badgeClass = "vacancy-pill-badge empty-room";
                        badgeText = "All Vacant";
                        cardClass = "room-item vacant fully-empty";
                      } else if (isNearlyFull) {
                        badgeClass = "vacancy-pill-badge nearly-full-room";
                        badgeText = "Last Bed";
                        cardClass = "room-item vacant nearly-full";
                      }

                      return (
                        <div 
                          key={idx} 
                          className={cardClass}
                          onClick={() => {
                            if (room.block_number && room.room_number) {
                              navigate(`/room/${encodeURIComponent(room.block_number)}/${encodeURIComponent(room.room_number)}`);
                            }
                          }}
                        >
                          <div className="room-card-top">
                            <span className="room-number-styled">Room {room.room_number}</span>
                            <span className="room-icon-styled">🛏️</span>
                          </div>
                          
                          <div className="room-status-text">
                            {occupied} of {capacity} beds occupied
                          </div>

                          <div className="room-card-top" style={{ marginTop: 'auto', alignItems: 'center' }}>
                            <div className="bed-dots-container">
                              {Array.from({ length: capacity }).map((_, i) => (
                                <span 
                                  key={i} 
                                  className={`bed-dot ${i < occupied ? 'occupied' : 'vacant'}`}
                                  title={i < occupied ? "Occupied Bed" : "Available Bed"}
                                ></span>
                              ))}
                            </div>
                            <span className={badgeClass}>{badgeText}</span>
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
                  <>No residents found. <span style={{ cursor: "pointer", color: "#667eea", textDecoration: "underline", marginLeft: "5px" }} onClick={() => navigate("/residents-list?add=true")}>Add a resident</span></>
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

      {/* Analytics & Growth Insights View */}
      {activeView === 'analytics' && (() => {
        const data = getFilteredData();
        const currentData = data.find(d => d.month === selectedMonth) || data[5];

        // KPI Calculations
        const newResidents = currentData.newResidents;
        const vacatedResidents = currentData.vacatedResidents;
        const netGrowth = newResidents - vacatedResidents;
        const totalRooms = currentData.occupiedRooms + currentData.vacantRooms;
        const occupancyRate = totalRooms > 0 ? Math.round((currentData.occupiedRooms / totalRooms) * 100) : 0;

        // Funnel Rates
        const leads = currentData.newLeads;
        const visits = currentData.siteVisits;
        const registrations = currentData.registrations;
        const joined = currentData.joinedResidents;
        const vacated = currentData.vacatedResidents;

        const leadToVisit = leads > 0 ? Math.round((visits / leads) * 100) : 0;
        const visitToReg = visits > 0 ? Math.round((registrations / visits) * 100) : 0;
        const regToJoined = registrations > 0 ? Math.round((joined / registrations) * 100) : 0;
        const overallConv = leads > 0 ? Math.round((joined / leads) * 100) : 0;

        // Insights calculations
        let bestMonth = "";
        let maxNet = -999;
        data.forEach(d => {
          const net = d.newResidents - d.vacatedResidents;
          if (net > maxNet) {
            maxNet = net;
            bestMonth = d.month;
          }
        });

        let weakMonth = "";
        let minNet = 999;
        data.forEach(d => {
          const net = d.newResidents - d.vacatedResidents;
          if (net < minNet) {
            minNet = net;
            weakMonth = d.month;
          }
        });

        const ratio = joined > 0 ? Math.round((vacated / joined) * 100) : 0;
        let retentionText = "";
        if (ratio === 0) {
          retentionText = "Excellent stability. No move-outs recorded.";
        } else if (ratio < 25) {
          retentionText = `Strong retention. Departures are only ${ratio}% of new admissions.`;
        } else if (ratio < 50) {
          retentionText = `Healthy growth. Departures are ${ratio}% of new admissions.`;
        } else {
          retentionText = `High turnover. Departures are ${ratio}% of new admissions; review feedback.`;
        }

        // SVG Chart Dimensions & Computations
        const chartW = 500;
        const chartH = 240;
        const paddingL = 40;
        const paddingR = 20;
        const paddingB = 40;
        const paddingT = 20;
        const graphW = chartW - paddingL - paddingR;
        const graphH = chartH - paddingT - paddingB;

        // Max values for scaling
        const maxBarVal = Math.max(...data.map(d => Math.max(d.newResidents, d.vacatedResidents)), 10);

        return (
          <div className="analytics-view">
            {/* Header controls */}
            <div className="analytics-header-controls">
              <div className="controls-left">
                <h3>📈 Analytics & Growth Insights</h3>
                <p className="header-subtitle">Visualize occupancies, movement trends, and marketing conversions</p>
              </div>
              <div className="controls-right">
                <div className="filter-group">
                  <label htmlFor="block-filter">Block:</label>
                  <select
                    id="block-filter"
                    value={selectedBlockFilter}
                    onChange={(e) => setSelectedBlockFilter(e.target.value)}
                    className="analytics-select"
                  >
                    <option value="All">All Blocks</option>
                    <option value="1">Block 1</option>
                    <option value="2">Block 2</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="month-filter">Month:</label>
                  <select
                    id="month-filter"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="analytics-select"
                  >
                    {data.map((d) => (
                      <option key={d.month} value={d.month}>{d.month} 2026</option>
                    ))}
                  </select>
                </div>
                <Button variant="primary" onClick={handleExportCSV} className="export-btn">
                  📤 Export Data
                </Button>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="analytics-kpi-grid">
              <div className="analytics-kpi-card new-residents">
                <div className="kpi-icon">📥</div>
                <div className="kpi-details">
                  <span className="kpi-value">{newResidents}</span>
                  <span className="kpi-title">New Residents</span>
                  <span className="kpi-trend positive">+{Math.round(newResidents * 0.1 || 1)} vs last month</span>
                </div>
              </div>

              <div className="analytics-kpi-card vacated-residents">
                <div className="kpi-icon">📤</div>
                <div className="kpi-details">
                  <span className="kpi-value">{vacatedResidents}</span>
                  <span className="kpi-title">Vacated Residents</span>
                  <span className="kpi-trend negative">-{Math.round(vacatedResidents * 0.1 || 1)} vs last month</span>
                </div>
              </div>

              <div className="analytics-kpi-card net-growth">
                <div className="kpi-icon">📈</div>
                <div className="kpi-details">
                  <span className={`kpi-value ${netGrowth >= 0 ? 'positive' : 'negative'}`}>
                    {netGrowth >= 0 ? `+${netGrowth}` : netGrowth}
                  </span>
                  <span className="kpi-title">Net Resident Growth</span>
                  <span className="kpi-subtext">New minus vacated</span>
                </div>
              </div>

              <div className="analytics-kpi-card occupancy-rate">
                <div className="kpi-icon">🏢</div>
                <div className="kpi-details">
                  <span className="kpi-value">{occupancyRate}%</span>
                  <span className="kpi-title">Occupancy Rate</span>
                  <div className="kpi-progress">
                    <div className="kpi-progress-bar" style={{ width: `${occupancyRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="analytics-charts-grid">
              {/* Bar Chart: New vs Vacated */}
              <div className="chart-card-container">
                <h4>Monthly Admissions & Departures</h4>
                <div className="svg-wrapper" style={{ position: "relative" }}>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="100%">
                    <defs>
                      <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#48bb78" />
                        <stop offset="100%" stopColor="#38a169" />
                      </linearGradient>
                      <linearGradient id="vacGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f56565" />
                        <stop offset="100%" stopColor="#e53e3e" />
                      </linearGradient>
                    </defs>

                    {/* Y Axis gridlines & helper text */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const yPos = paddingT + graphH * (1 - ratio);
                      const label = Math.round(ratio * maxBarVal);
                      return (
                        <g key={index}>
                          <line
                            x1={paddingL}
                            y1={yPos}
                            x2={chartW - paddingR}
                            y2={yPos}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingL - 10}
                            y={yPos + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#718096"
                          >
                            {label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars Rendering */}
                    {data.map((d, index) => {
                      const xCenter = paddingL + (index * (graphW / 6)) + (graphW / 12);
                      const barW = 12;
                      const gap = 3;

                      const newH = (d.newResidents / maxBarVal) * graphH;
                      const newY = paddingT + graphH - newH;

                      const vacH = (d.vacatedResidents / maxBarVal) * graphH;
                      const vacY = paddingT + graphH - vacH;

                      return (
                        <g key={index}>
                          {/* New Residents Bar */}
                          <rect
                            x={xCenter - barW - gap}
                            y={newY}
                            width={barW}
                            height={newH}
                            fill="url(#newGrad)"
                            rx="3"
                            ry="3"
                            style={{ transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => setHoveredBar({
                              month: d.month,
                              type: "New",
                              value: d.newResidents,
                              x: xCenter - barW - gap + (barW/2),
                              y: newY - 10
                            })}
                            onMouseLeave={() => setHoveredBar(null)}
                          />

                          {/* Vacated Residents Bar */}
                          <rect
                            x={xCenter + gap}
                            y={vacY}
                            width={barW}
                            height={vacH}
                            fill="url(#vacGrad)"
                            rx="3"
                            ry="3"
                            style={{ transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => setHoveredBar({
                              month: d.month,
                              type: "Vacated",
                              value: d.vacatedResidents,
                              x: xCenter + gap + (barW/2),
                              y: vacY - 10
                            })}
                            onMouseLeave={() => setHoveredBar(null)}
                          />

                          {/* X-axis Month Label */}
                          <text
                            x={xCenter}
                            y={chartH - 15}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill="#4a5568"
                          >
                            {d.month}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-axis Line */}
                    <line
                      x1={paddingL}
                      y1={chartH - paddingB}
                      x2={chartW - paddingR}
                      y2={chartH - paddingB}
                      stroke="#cbd5e0"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* HTML Tooltip inside chart relative space */}
                  {hoveredBar && (
                    <div
                      className="chart-tooltip"
                      style={{
                        position: "absolute",
                        left: `${(hoveredBar.x / chartW) * 100}%`,
                        top: `${(hoveredBar.y / chartH) * 100}%`,
                        transform: "translate(-50%, -100%)"
                      }}
                    >
                      <div className="tooltip-title">{hoveredBar.month}</div>
                      <div className="tooltip-value">
                        <span className={`bullet ${hoveredBar.type.toLowerCase()}`}></span>
                        {hoveredBar.type}: {hoveredBar.value}
                      </div>
                    </div>
                  )}
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-bullet new"></span>New Admissions</span>
                  <span className="legend-item"><span className="legend-bullet vacated"></span>Departures</span>
                </div>
              </div>

              {/* Line Chart: Occupancy Rate Trend */}
              <div className="chart-card-container">
                <h4>Occupancy Trend month by month</h4>
                <div className="svg-wrapper" style={{ position: "relative" }}>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="100%">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#667eea" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#667eea" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>

                    {/* Y Gridlines & labels (0% to 100%) */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const yPos = paddingT + graphH * (1 - ratio);
                      return (
                        <g key={index}>
                          <line
                            x1={paddingL}
                            y1={yPos}
                            x2={chartW - paddingR}
                            y2={yPos}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingL - 10}
                            y={yPos + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#718096"
                          >
                            {Math.round(ratio * 100)}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Line & Area Construction */}
                    {(() => {
                      const coords = data.map((d, index) => {
                        const x = paddingL + (index * (graphW / 5));
                        const pct = d.totalRooms > 0 ? (d.occupiedRooms / d.totalRooms) : 0;
                        const y = paddingT + graphH - (pct * graphH);
                        return { x, y, pct: Math.round(pct * 100), month: d.month };
                      });

                      const pathStr = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                      const areaStr = `${pathStr} L ${coords[coords.length - 1].x} ${paddingT + graphH} L ${coords[0].x} ${paddingT + graphH} Z`;

                      return (
                        <>
                          {/* Gradient Area */}
                          <path d={areaStr} fill="url(#areaGrad)" />

                          {/* Line */}
                          <path
                            d={pathStr}
                            fill="none"
                            stroke="url(#lineGrad)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Points */}
                          {coords.map((c, index) => (
                            <circle
                              key={index}
                              cx={c.x}
                              cy={c.y}
                              r={hoveredLine && hoveredLine.month === c.month ? 7 : 4.5}
                              fill={hoveredLine && hoveredLine.month === c.month ? "#764ba2" : "#667eea"}
                              stroke="white"
                              strokeWidth="2"
                              style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                              onMouseEnter={() => setHoveredLine({
                                month: c.month,
                                value: `${c.pct}%`,
                                x: c.x,
                                y: c.y - 10
                              })}
                              onMouseLeave={() => setHoveredLine(null)}
                            />
                          ))}

                          {/* X Labels */}
                          {coords.map((c, index) => (
                            <text
                              key={index}
                              x={c.x}
                              y={chartH - 15}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="600"
                              fill="#4a5568"
                            >
                              {c.month}
                            </text>
                          ))}
                        </>
                      );
                    })()}

                    {/* X axis line */}
                    <line
                      x1={paddingL}
                      y1={chartH - paddingB}
                      x2={chartW - paddingR}
                      y2={chartH - paddingB}
                      stroke="#cbd5e0"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* HTML Tooltip for Line Chart */}
                  {hoveredLine && (
                    <div
                      className="chart-tooltip"
                      style={{
                        position: "absolute",
                        left: `${(hoveredLine.x / chartW) * 100}%`,
                        top: `${(hoveredLine.y / chartH) * 100}%`,
                        transform: "translate(-50%, -100%)"
                      }}
                    >
                      <div className="tooltip-title">{hoveredLine.month}</div>
                      <div className="tooltip-value">Occupancy: {hoveredLine.value}</div>
                    </div>
                  )}
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-bullet line-bullet"></span>Occupancy Rate</span>
                </div>
              </div>

              {/* Donut Chart: Occupied vs Vacant */}
              <div className="chart-card-container donut-chart-container">
                <h4>Room Breakdown ({selectedMonth})</h4>
                <div className="donut-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", height: "100%", padding: "10px 0" }}>
                  <div className="svg-wrapper" style={{ width: "160px", height: "160px", position: "relative" }}>
                    <svg viewBox="0 0 100 100" width="100%" height="100%">
                      {(() => {
                        const r = 38;
                        const circ = 2 * Math.PI * r;
                        const pOcc = currentData.occupiedRooms / totalRooms || 0.8;
                        const dashOcc = pOcc * circ;
                        const dashVac = circ - dashOcc;

                        return (
                          <g transform="rotate(-90 50 50)">
                            {/* Background Circle (Vacant) */}
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="none"
                              stroke="#edf2f7"
                              strokeWidth="10"
                            />
                            
                            {/* Vacant Segment */}
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="10.5"
                              strokeDasharray={circ}
                              strokeDashoffset={0}
                            />

                            {/* Occupied Segment */}
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="none"
                              stroke="url(#lineGrad)"
                              strokeWidth="11"
                              strokeDasharray={`${dashOcc} ${dashVac}`}
                              strokeDashoffset={0}
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      })()}
                    </svg>
                    <div className="donut-inner-text" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                      <span className="donut-pct" style={{ fontSize: "20px", fontWeight: "800", color: "#2c3e50", display: "block" }}>{occupancyRate}%</span>
                      <span className="donut-sub" style={{ fontSize: "10px", color: "#718096", textTransform: "uppercase", fontWeight: "600" }}>Occupied</span>
                    </div>
                  </div>

                  <div className="donut-legend">
                    <div className="donut-legend-item">
                      <div className="legend-color-box occupied-box"></div>
                      <div className="legend-label-group">
                        <span className="legend-count">{currentData.occupiedRooms} Rooms</span>
                        <span className="legend-name">Occupied Rooms</span>
                      </div>
                    </div>
                    <div className="donut-legend-item">
                      <div className="legend-color-box vacant-box"></div>
                      <div className="legend-label-group">
                        <span className="legend-count">{currentData.vacantRooms} Rooms</span>
                        <span className="legend-name">Vacant Rooms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Funnel Flow Chart Section */}
            <div className="section-card funnel-card">
              <h3>📣 Marketing Pipeline & Funnel Analysis ({selectedMonth})</h3>
              <p className="funnel-description">
                Analyze student onboarding drop-offs from enquiry to admission to optimize conversion rates.
              </p>

              <div className="funnel-flow-container">
                {/* Stage 1: Enquiries */}
                <div className="funnel-stage">
                  <div className="stage-card border-purple">
                    <span className="stage-icon">📞</span>
                    <span className="stage-count">{leads}</span>
                    <span className="stage-name">Leads / Enquiries</span>
                  </div>
                </div>

                {/* Arrow 1 */}
                <div className="funnel-arrow">
                  <span className="arrow-text">{leadToVisit}%</span>
                  <span className="arrow-symbol">→</span>
                </div>

                {/* Stage 2: Visits */}
                <div className="funnel-stage">
                  <div className="stage-card border-blue">
                    <span className="stage-icon">🚶‍♂️</span>
                    <span className="stage-count">{visits}</span>
                    <span className="stage-name">Hostel Visits</span>
                  </div>
                </div>

                {/* Arrow 2 */}
                <div className="funnel-arrow">
                  <span className="arrow-text">{visitToReg}%</span>
                  <span className="arrow-symbol">→</span>
                </div>

                {/* Stage 3: Registrations */}
                <div className="funnel-stage">
                  <div className="stage-card border-yellow">
                    <span className="stage-icon">📝</span>
                    <span className="stage-count">{registrations}</span>
                    <span className="stage-name">Registrations</span>
                  </div>
                </div>

                {/* Arrow 3 */}
                <div className="funnel-arrow">
                  <span className="arrow-text">{regToJoined}%</span>
                  <span className="arrow-symbol">→</span>
                </div>

                {/* Stage 4: Joined */}
                <div className="funnel-stage">
                  <div className="stage-card border-green">
                    <span className="stage-icon">🔑</span>
                    <span className="stage-count">{joined}</span>
                    <span className="stage-name">Joined Residents</span>
                  </div>
                </div>

                {/* Arrow 4 */}
                <div className="funnel-arrow dropoff-arrow">
                  <span className="arrow-text text-red">Vacate</span>
                  <span className="arrow-symbol text-red">↘</span>
                </div>

                {/* Stage 5: Vacated */}
                <div className="funnel-stage">
                  <div className="stage-card border-red">
                    <span className="stage-icon">🚪</span>
                    <span className="stage-count">{vacated}</span>
                    <span className="stage-name">Vacated Residents</span>
                  </div>
                </div>
              </div>

              {/* Conversion Statistics Summaries */}
              <div className="funnel-metrics-summary">
                <div className="metric-box">
                  <span className="metric-title">Lead Conversion Rate</span>
                  <span className="metric-value">{overallConv}%</span>
                  <p className="metric-desc">Percentage of total enquiries who successfully joined</p>
                </div>
                <div className="metric-box">
                  <span className="metric-title">Visit Conversion Rate</span>
                  <span className="metric-value">{visits > 0 ? Math.round((joined / visits) * 100) : 0}%</span>
                  <p className="metric-desc">Percentage of visiting prospects who finalized onboarding</p>
                </div>
                <div className="metric-box font-medium">
                  <span className="metric-title">Funnel Drop-Off Rate</span>
                  <span className="metric-value text-red">{100 - overallConv}%</span>
                  <p className="metric-desc">Loss rate from initial lead capture to keys handed over</p>
                </div>
              </div>
            </div>

            {/* Marketing Insights */}
            <div className="section-card insights-card">
              <h3>💡 Actionable Marketing & Occupancy Insights</h3>
              <div className="insights-panel">
                <div className="insight-item">
                  <div className="insight-header">
                    <span className="insight-indicator green">★</span>
                    <h5>Best Performing Month</h5>
                  </div>
                  <p>
                    <strong>{bestMonth} 2026</strong> performed the strongest with the highest net growth of new resident intake.
                    This month shows strong marketing campaigns or seasonal university/corporate admission batches.
                  </p>
                </div>

                <div className="insight-item">
                  <div className="insight-header">
                    <span className="insight-indicator yellow">⚠</span>
                    <h5>Weakest Intake Period</h5>
                  </div>
                  <p>
                    <strong>{weakMonth} 2026</strong> experienced lower net growth or higher departures. Consider introducing referral bonuses or special discount campaigns during this phase of the year.
                  </p>
                </div>

                <div className="insight-item">
                  <div className="insight-header">
                    <span className="insight-indicator blue">ℹ</span>
                    <h5>Conversion Efficiency</h5>
                  </div>
                  <p>
                    Current Lead-to-Admission rate is <strong>{overallConv}%</strong>. 
                    {overallConv > 10 
                      ? " Your conversion pipeline is healthy. Focus on increasing lead volume through social media promotion and community outreach."
                      : " Pipeline conversions are low. Look into site tour experiences, pricing adjustments, or faster follow-up responses."
                    }
                  </p>
                </div>

                <div className="insight-item">
                  <div className="insight-header">
                    <span className="insight-indicator purple">👤</span>
                    <h5>Retention Assessment</h5>
                  </div>
                  <p>
                    {retentionText} Tracking exit surveys can provide valuable insights on whether the departures are related to work relocation, university completions, or facility operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
        </div>
      )}
    </Layout>
  );
}

