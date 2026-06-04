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
import { Button, Alert } from "../components/ui";

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
          <Button type="button" className="back-btn" variant="secondary" onClick={() => navigate("/blocks") }>
            ← Back to all blocks
          </Button>
          <h2>Block {blockNumber}</h2>
          <p className="hierarchy-sub">Choose a floor to view room numbers</p>
        </div>

        <Alert>{error}</Alert>

        {floorEntries.length === 0 ? (
          <div className="empty-state hierarchy-empty">
            <p>No floors or rooms recorded for this block yet.</p>
          </div>
        ) : (
          <div className="floors-grid">
            {floorEntries.map(({ floorKey, label, roomCount }) => (
              <Button
                key={floorKey}
                type="button"
                className="block-simple-card floor-card"
                variant="secondary"
                onClick={() =>
                  navigate(
                    `/block/${encodeURIComponent(blockNumber)}/floor/${encodeURIComponent(floorKey)}`
                  )
                }
              >
                <div className="block-simple-header">
                  <h3>{label}</h3>
                </div>
                <p className="block-simple-hint">{roomCount} room(s) →</p>
              </Button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
