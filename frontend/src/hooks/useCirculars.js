import { useState } from "react";
import API from "../services/api";

export function useCirculars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCirculars = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/circulars");
      if (res.data.success) {
        setCirculars(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load circulars");
    } finally {
      setLoading(false);
    }
  };

  const publishCircular = async (formData) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.post("/circulars", formData);
      if (res.data.success) {
        return { success: true, stats: res.data.stats, data: res.data.data };
      }
      return { success: false, message: "Failed to send circular" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send circular";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const removeCircular = async (id) => {
    try {
      setError("");
      const res = await API.delete(`/circulars/${id}`);
      if (res.data.success) {
        setCirculars(prev => prev.filter(c => c.id !== id));
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete circular";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  return {
    circulars,
    loading,
    error,
    fetchCirculars,
    publishCircular,
    removeCircular
  };
}
