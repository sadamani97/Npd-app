import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { normalizeFloorKey, labelFloors, compareFloorKeys } from "../utils/floorLabels";
import "../styles/BlocksHierarchy.css";
import { Button, Alert } from "../components/ui";

const compareRoomNumbers = (a, b) =>
  String(a.room_number || "").localeCompare(String(b.room_number || ""), undefined, {
    numeric: true,
    sensitivity: "base"
  });

const formatRoomNumber = (roomNumber) =>
  String(roomNumber || "").trim().toUpperCase();

export default function BlockFloorRoomsPage() {
  const { blockNumber, floorNumber: floorParam } = useParams();
  const navigate = useNavigate();
  const floorKeyDecoded = normalizeFloorKey(
    floorParam ? decodeURIComponent(floorParam) : ""
  );

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [floorLabelsByKey, setFloorLabelsByKey] = useState(new Map());

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/rooms/block/${blockNumber}`);
      if (!res.data.success) {
        setError("Failed to load rooms");
        return;
      }
      const list = res.data.data || [];
      setRooms(Array.isArray(list) ? list : []);

      const uniqueFloors = [
        ...new Set(list.map((r) => normalizeFloorKey(r.floor_number))).values()
      ].sort(compareFloorKeys);
      const labeled = labelFloors(uniqueFloors);
      const map = new Map(labeled.map((x) => [x.floorKey, x.label]));
      setFloorLabelsByKey(map);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [blockNumber]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const floorLabel =
    floorLabelsByKey.get(floorKeyDecoded) || `Floor ${floorKeyDecoded}`;

  const roomsOnFloor = useMemo(() => {
    return rooms
      .filter((r) => normalizeFloorKey(r.floor_number) === floorKeyDecoded)
      .slice()
      .sort(compareRoomNumbers);
  }, [rooms, floorKeyDecoded]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading rooms...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blocks-hierarchy">
        <div className="hierarchy-header">
          <Button
            type="button"
            className="back-btn"
            variant="secondary"
            onClick={() => navigate(`/block/${encodeURIComponent(blockNumber)}`)}
          >
            ← Back to floors (Block {blockNumber})
          </Button>
          <h2>{floorLabel}</h2>
          <p className="hierarchy-sub">Block {blockNumber} · {roomsOnFloor.length} room(s)</p>
        </div>

        <Alert>{error}</Alert>

        {roomsOnFloor.length === 0 ? (
          <div className="empty-state hierarchy-empty">
            <p>No rooms on this floor.</p>
          </div>
        ) : (
          <div className="room-number-grid">
            {roomsOnFloor.map((room) => {
              const occ = Array.isArray(room.residents_in_room)
                ? room.residents_in_room.length
                : Number(room.current_occupancy ?? 0);
              const vacant = occ === 0;
              const displayRoomNumber = formatRoomNumber(room.room_number);
              return (
                <Button
                  key={`${blockNumber}-${displayRoomNumber}`}
                  type="button"
                  className={`room-number-tile ${vacant ? "vacant" : "occupied"}`}
                  variant="secondary"
                  onClick={() =>
                    navigate(
                      `/room/${encodeURIComponent(blockNumber)}/${encodeURIComponent(room.room_number)}`
                    )
                  }
                >
                  <span className="tile-label">{displayRoomNumber}</span>
                  <span className="tile-meta">
                    {vacant ? "Vacant" : `${occ} resident(s)`}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
