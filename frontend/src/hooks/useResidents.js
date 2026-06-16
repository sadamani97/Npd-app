import { useState } from "react";
import API from "../services/api";

export function useResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResidents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/users");
      if (res.data.success) {
        setResidents(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load residents");
    } finally {
      setLoading(false);
    }
  };

  const addResident = async (formData) => {
    try {
      setLoading(true);
      setError("");
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      const res = await API.post("/users", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to add resident" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add resident";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const editResident = async (id, formData) => {
    try {
      setLoading(true);
      setError("");
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      const res = await API.put(`/users/${id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to update resident" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update resident";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const vacateResident = async (id) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.put(`/users/vacate/${id}`);
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: "Failed to vacate resident" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to vacate resident";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    residents,
    loading,
    error,
    fetchResidents,
    addResident,
    editResident,
    vacateResident
  };
}
