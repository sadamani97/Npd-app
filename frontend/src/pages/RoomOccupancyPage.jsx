import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/RoomOccupancy.css";

const ROOM_TYPE_CAPACITY = {
  SINGLE_SHARE: 1,
  DOUBLE_SHARE: 2,
  TRIPLE_SHARE: 3,
  FOUR_SHARE: 4,
  FIVE_SHARE: 5,
  SIX_SHARE: 6
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const compareRoomNumbers = (a, b) =>
  String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });

const getCapacity = (item) => {
  const capacity = Number.parseInt(item?.capacity, 10);
  if (Number.isFinite(capacity) && capacity > 0) return capacity;

  const roomType = String(item?.room_type || "").toUpperCase();
  return ROOM_TYPE_CAPACITY[roomType] || 2;
};

const getBlockNumber = (value) => String(value || "Not Assigned").trim() || "Not Assigned";
const getRoomNumber = (value) => String(value || "Unassigned").trim() || "Unassigned";

const buildRoomsFromResidents = (residents = []) => {
  const roomMap = new Map();

  residents.forEach((resident) => {
    const blockNumber = getBlockNumber(resident.block_number);
    const roomNumber = getRoomNumber(resident.room_number);
    const key = `${blockNumber}::${roomNumber}`;
    const capacity = getCapacity(resident);

    if (!roomMap.has(key)) {
      roomMap.set(key, {
        id: key,
        block_number: blockNumber,
        room_number: roomNumber,
        room_type: resident.room_type || "DOUBLE_SHARE",
        ac_status: resident.ac_status || "NON_AC",
        capacity,
        occupants: 0,
        status: "AVAILABLE"
      });
    }

    const room = roomMap.get(key);
    room.occupants += 1;
    room.capacity = Math.max(room.capacity, capacity);
    room.status = "OCCUPIED";
  });

  return Array.from(roomMap.values());
};

const normalizeRoom = (room) => {
  const occupants = toNumber(room.occupants ?? room.occupied ?? room.current_occupancy);
  const capacity = getCapacity(room);
  const status = room.status || (occupants > 0 ? "OCCUPIED" : "AVAILABLE");

  return {
    id: room.id || `${room.block_number}-${room.room_number}`,
    block_number: getBlockNumber(room.block_number),
    room_number: getRoomNumber(room.room_number),
    room_type: room.room_type || "DOUBLE_SHARE",
    ac_status: room.ac_status || "NON_AC",
    capacity,
    occupants,
    vacancy: Math.max(capacity - occupants, 0),
    status
  };
};

const mergeOccupancyData = (summaryRooms = [], dashboardData = {}, residents = []) => {
  const dashboardRooms = dashboardData.roomOccupancy || [];
  const sourceRooms = summaryRooms.length > 0
    ? summaryRooms
    : dashboardRooms.length > 0
      ? dashboardRooms
      : buildRoomsFromResidents(residents);

  return sourceRooms
    .map(normalizeRoom)
    .filter((room) => room.block_number === "1" || room.block_number === "2")
    .sort((a, b) => {
      const blockCompare = compareRoomNumbers(a.block_number, b.block_number);
      return blockCompare || compareRoomNumbers(a.room_number, b.room_number);
    });
};

export default function RoomOccupancyPage() {
  const [occupancyData, setOccupancyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOccupancyData();
  }, []);

  const fetchOccupancyData = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryResult, statsResult, usersResult] = await Promise.allSettled([
        API.get("/dashboard/rooms"),
        API.get("/dashboard/stats"),
        API.get("/users")
      ]);

      const summaryRooms = summaryResult.status === "fulfilled" && summaryResult.value.data.success
        ? summaryResult.value.data.data || []
        : [];
      const dashboardData = statsResult.status === "fulfilled" && statsResult.value.data.success
        ? statsResult.value.data.data || {}
        : {};
      const residents = usersResult.status === "fulfilled" && usersResult.value.data.success
        ? usersResult.value.data.data || []
        : [];

      setOccupancyData(mergeOccupancyData(summaryRooms, dashboardData, residents));

      if (summaryResult.status === "rejected" && statsResult.status === "rejected" && usersResult.status === "rejected") {
        throw summaryResult.reason;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load occupancy data");
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
          <p>Loading Occupancy Data...</p>
        </div>
      </Layout>
    );
  }

  // Group data by block
  let groupedByBlock = {};
  if (occupancyData) {
    occupancyData.forEach((room) => {
      if (!groupedByBlock[room.block_number]) {
        groupedByBlock[room.block_number] = [];
      }
      groupedByBlock[room.block_number].push(room);
    });
  }

  const blocks = Object.keys(groupedByBlock).sort(compareRoomNumbers);
  const filteredBlocks = filterBlock === "all" ? blocks : [filterBlock];

  return (
    <Layout>
      <div className="occupancy-container">
        <div className="occupancy-header">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            ← Back to Dashboard
          </button>
          <h2>🛏️ Room Occupancy status</h2>
          <p>Total Rooms: {occupancyData?.length || 0}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {blocks.length === 0 ? (
          <div className="empty-state">
            <p>No room occupancy data found. Add residents with block and room numbers first.</p>
          </div>
        ) : (
          <>

        {/* Block Filter */}
        <div className="occupancy-filter">
          <label>Filter by Block:</label>
          <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)}>
            <option value="all">All Blocks</option>
            {blocks.map((block) => (
              <option key={block} value={block}>
                Block {block}
              </option>
            ))}
          </select>
        </div>

        {/* Occupancy Grid */}
        <div className="occupancy-sections">
          {filteredBlocks.map((block) => (
            <div key={block} className="block-occupancy-section">
              <div className="section-header">
                <h3>Block {block}</h3>
                <span className="room-count">{groupedByBlock[block].length} rooms</span>
              </div>

              <div className="rooms-occupancy-grid">
                {groupedByBlock[block].map((room) => (
                  <div
                    key={room.id}
                    className={`occupancy-room-card ${room.status.toLowerCase()}`}
                    onClick={() => room.block_number !== "Not Assigned" && room.room_number !== "Unassigned" && navigate(`/room/${room.block_number}/${room.room_number}`)}
                    style={{ cursor: room.block_number === "Not Assigned" || room.room_number === "Unassigned" ? "default" : "pointer" }}
                  >
                    <div className="room-label">
                      <strong>Room {room.room_number}</strong>
                    </div>

                    <div className="occupancy-info">
                      <div className="occupancy-stat">
                        <span className="occupancy-number">{room.occupants}</span>
                        <span className="occupancy-text">of {room.capacity}</span>
                      </div>
                    </div>

                    <div className="room-occupancy-bar">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${room.capacity > 0 ? (room.occupants / room.capacity) * 100 : 0}%`
                        }}
                      ></div>
                    </div>

                    <div className="room-details-compact">
                      <span className="detail-item">
                        {room.room_type?.replace(/_/g, " ")}
                      </span>
                      <span className="detail-item">{room.ac_status}</span>
                      <span className="detail-item">{room.vacancy} vacant</span>
                    </div>

                    <div className="room-status-footer">
                      <span className="status-indicator">
                        {room.occupants === 0 ? "🟢 Empty" : room.occupants === room.capacity ? "🔴 Full" : "🟡 Partial"}
                      </span>
                    </div>

                    <div className="card-overlay-interactive">Click for details</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </Layout>
  );
}
