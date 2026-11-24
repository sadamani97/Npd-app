import { useState } from "react";
import API from "../services/api";

export function useRooms() {
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
  const [blocks, setBlocks] = useState([]);
  const [blockRooms, setBlockRooms] = useState([]);
  const [roomDetails, setRoomDetails] = useState(null);
  const [occupancySummary, setOccupancySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/dashboard/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsOccupancySummary = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/dashboard/rooms");
      if (res.data.success) {
        setOccupancySummary(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rooms occupancy summary");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/rooms/blocks");
      if (res.data.success) {
        setBlocks(res.data.data || []);
        return { success: true, data: res.data.data };
      }
      return { success: false };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load blocks");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockRooms = async (blockNumber) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/rooms/block/${encodeURIComponent(blockNumber)}`);
      if (res.data.success) {
        setBlockRooms(res.data.data || []);
        return { success: true, data: res.data.data };
      }
      return { success: false };
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load rooms for block ${blockNumber}`);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetails = async (blockNumber, roomNumber) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/rooms/${encodeURIComponent(blockNumber)}/${encodeURIComponent(roomNumber)}`);
      if (res.data.success) {
        setRoomDetails(res.data.data);
        return { success: true, data: res.data.data };
      }
      return { success: false };
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load room details for Room ${roomNumber} in Block ${blockNumber}`);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addRoom = async (roomData) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.post("/rooms", roomData);
      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to add room" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add room";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateRoom = async (id, roomData) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.put(`/rooms/${id}`, roomData);
      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to update room" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update room";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (id) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.delete(`/rooms/${id}`);
      if (res.data.success) {
        return { success: true };
      }
      return { success: false, message: "Failed to delete room" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete room";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    blocks,
    blockRooms,
    roomDetails,
    occupancySummary,
    loading,
    error,
    fetchDashboardStats,
    fetchRoomsOccupancySummary,
    fetchBlocks,
    fetchBlockRooms,
    fetchRoomDetails,
    addRoom,
    updateRoom,
    deleteRoom
  };
}
