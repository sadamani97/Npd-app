import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/BlocksHierarchy.css";
import { Alert, StatsGridSkeleton, CardSkeleton } from "../components/ui";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/rooms/blocks");
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setBlocks(res.data.data);
      } else {
        setError("Could not load blocks");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load blocks");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="hierarchy-header">
          <h2>🏢 Blocks Management</h2>
          <p className="hierarchy-sub">Loading live block and room metrics from database...</p>
        </div>
        <StatsGridSkeleton count={2} />
        <div className="cards-grid" style={{ marginTop: "24px" }}>
          <CardSkeleton lines={4} height="180px" />
          <CardSkeleton lines={4} height="180px" />
        </div>
      </Layout>
    );
  }

  const displayBlocks = blocks.length > 0
    ? blocks
    : [
        { block_number: "1", total_rooms: 25, occupied_rooms: 2, vacant_rooms: 23, residents_count: 2 },
        { block_number: "2", total_rooms: 29, occupied_rooms: 0, vacant_rooms: 29, residents_count: 0 }
      ];

  return (
    <Layout>
      <div className="blocks-page-simple blocks-hierarchy">
        <div className="hierarchy-header">
          <div className="hierarchy-header-actions">
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
          <h2>🏢 Hostel Blocks</h2>
          <p className="hierarchy-sub">{displayBlocks.length} Active Block(s) configured</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="blocks-simple-grid">
          {displayBlocks.map((b) => {
            const num = String(b.block_number ?? b);
            const totalRooms = b.total_rooms != null ? b.total_rooms : "—";
            const occupied = b.occupied_rooms != null ? b.occupied_rooms : 0;
            const vacant = b.vacant_rooms != null ? b.vacant_rooms : 0;
            const residents = b.residents_count != null ? b.residents_count : 0;

            return (
              <div
                key={num}
                className="block-simple-card"
                onClick={() => navigate(`/block/${encodeURIComponent(num)}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/block/${encodeURIComponent(num)}`);
                  }
                }}
              >
                <div className="block-simple-header">
                  <h3>Block {num}</h3>
                  <span className="block-badge-table">Active</span>
                </div>

                <div className="block-stats-mini-row">
                  <div className="mini-stat">
                    <span className="mini-stat-label">Total Rooms</span>
                    <span className="mini-stat-val">{totalRooms}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Occupied</span>
                    <span className="mini-stat-val text-warning">{occupied}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Vacant</span>
                    <span className="mini-stat-val text-success">{vacant}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Residents</span>
                    <span className="mini-stat-val text-primary">{residents}</span>
                  </div>
                </div>

                <p className="block-simple-hint">Explore floors & room layout →</p>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
