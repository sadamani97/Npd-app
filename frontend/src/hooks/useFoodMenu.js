import { useState } from "react";
import API from "../services/api";

export function useFoodMenu() {
  const [menus, setMenus] = useState([]);
  const [menuForDate, setMenuForDate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMenus = async (params = {}) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/food-menus", { params });
      if (res.data.success) {
        setMenus(res.data.data || []);
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to load menus" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load menus";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuForDate = async (date) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/food-menus/date", { params: { date } });
      if (res.data.success) {
        const data = res.data.data || [];
        setMenuForDate(data);
        return { success: true, data };
      }
      return { success: false, message: "Failed to load menu for date" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load menu for date";
      setError(msg);
      setMenuForDate([]);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const addMenu = async (formData) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.post("/food-menus", formData);
      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to add food menu item" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add food menu item";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateMenu = async (id, formData) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.put(`/food-menus/${id}`, formData);
      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: "Failed to update food menu item" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update food menu item";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const deleteMenu = async (id) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.delete(`/food-menus/${id}`);
      if (res.data.success) {
        setMenus((prev) => prev.filter((item) => item.id !== id));
        return { success: true };
      }
      return { success: false, message: "Failed to delete food menu item" };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete food menu item";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    menus,
    menuForDate,
    loading,
    error,
    fetchMenus,
    fetchMenuForDate,
    addMenu,
    updateMenu,
    deleteMenu
  };
}
