import { useState } from "react";
import API from "../services/api";

export function useComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/complaints");
      if (res.data.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async (formData) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.post("/complaints", formData);
      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to submit complaint" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit complaint";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setError("");
      const res = await API.put(`/complaints/${id}/status`, { status: newStatus });
      if (res.data.success) {
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update complaint status";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const removeComplaint = async (id) => {
    try {
      setError("");
      const res = await API.delete(`/complaints/${id}`);
      if (res.data.success) {
        setComplaints(prev => prev.filter(c => c.id !== id));
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete complaint";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  return {
    complaints,
    loading,
    error,
    fetchComplaints,
    submitComplaint,
    updateStatus,
    removeComplaint
  };
}
