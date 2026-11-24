import { useState } from "react";
import API from "../services/api";
import { getCurrentUser } from "../utils/authUtils";

export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCurrentMonthPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/payments/status/current-month");
      if (res.data.success) {
        setPayments(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment status");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPayments = async (userId) => {
    try {
      setLoading(true);
      setError("");
      let id = userId;
      if (!id) {
        const currentUser = getCurrentUser();
        id = currentUser?.id;
      }
      if (!id) throw new Error("User ID is required");

      const res = await API.get(`/payments/history/${id}`);
      if (res.data.success) {
        setPayments(res.data.data.payments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  return { payments, loading, error, fetchCurrentMonthPayments, fetchUserPayments };
}
