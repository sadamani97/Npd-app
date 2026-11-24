import { useState } from "react";
import API from "../services/api";

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

  return { payments, loading, error, fetchCurrentMonthPayments };
}
