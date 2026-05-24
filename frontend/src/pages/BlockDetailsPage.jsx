import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import {
  normalizeFloorKey,
  labelFloors,
  compareFloorKeys
} from "../utils/floorLabels";
import "../styles/BlocksHierarchy.css";

export default function BlockDetailsPage() {
  const { blockNumber } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFloors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/rooms/block/${blockNumber}`);
      if (!res.data.success) {
        setError("Failed to load block");
        return;
      }
      setRooms(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load block");
    } finally {
      setLoading(false);
    }
  }, [blockNumber]);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  const floorEntries = useMemo(() => {
    const unique = [
      ...new Set(rooms.map((r) => normalizeFloorKey(r.floor_number))).values()
    ];
    if (!unique.length) return [];
    const labeled = labelFloors(unique);
    return labeled
      .map(({ floorKey, label }) => {
        const count = rooms.filter(
          (r) => normalizeFloorKey(r.floor_number) === floorKey
        ).length;
        return { floorKey, label, roomCount: count };
      })
      .sort((a, b) => compareFloorKeys(a.floorKey, b.floorKey));
  }, [rooms]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading floors...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blocks-hierarchy">
        <div className="hierarchy-header">
          <button type="button" className="back-btn" onClick={() => navigate("/blocks")}>
            ← Back to all blocks
          </button>
          <h2>Block {blockNumber}</h2>
          <p className="hierarchy-sub">Choose a floor to view room numbers</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {floorEntries.length === 0 ? (
          <div className="empty-state hierarchy-empty">
            <p>No floors or rooms recorded for this block yet.</p>
          </div>
        ) : (
          <div className="floors-grid">
            {floorEntries.map(({ floorKey, label, roomCount }) => (
              <button
                key={floorKey}
                type="button"
                className="floor-card"
                onClick={() =>
                  navigate(
                    `/block/${encodeURIComponent(blockNumber)}/floor/${encodeURIComponent(floorKey)}`
                  )
                }
              >
                <h3 className="floor-card-title">{label}</h3>
                <p className="floor-card-meta">{roomCount} room(s)</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
