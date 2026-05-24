import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/AdminFoodConfirmationList.css";

export default function AdminFoodConfirmationList() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [filter, setFilter] = useState("all"); // all, confirmed, not-confirmed

  useEffect(() => {
    if (user.role !== "ADMIN") {
      navigate("/user-dashboard");
      return;
    }

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split("T")[0];
    setSelectedDate(formattedDate);
    fetchConfirmations(formattedDate);
  }, []);

  const fetchConfirmations = async (date) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/food-confirmations/admin/by-date", {
        params: { confirmation_date: date }
      });
      if (res.data.success) {
        setConfirmations(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load confirmations");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchConfirmations(newDate);
  };

  const getFilteredConfirmations = () => {
    if (filter === "all") return confirmations;
    if (filter === "confirmed") return confirmations.filter((c) => c.is_confirmed);
    if (filter === "not-confirmed") return confirmations.filter((c) => !c.is_confirmed);
    return confirmations;
  };

  const getConfirmedCount = () => confirmations.filter((c) => c.is_confirmed).length;
  const getNotConfirmedCount = () => confirmations.filter((c) => !c.is_confirmed).length;

  const getMealCount = (mealType) => {
    return confirmations.filter((c) => c[mealType] === true).length;
  };

  const getMealsForConfirmation = (conf) => {
    const meals = [];
    if (conf.breakfast) meals.push("Breakfast");
    if (conf.lunch) meals.push("Lunch");
    if (conf.dinner) meals.push("Dinner");
    return meals.length > 0 ? meals.join(", ") : "None";
  };

  const exportToCSV = () => {
    const filteredData = getFilteredConfirmations();
    const headers = ["Room", "Name", "Phone", "Block", "Breakfast", "Lunch", "Dinner", "Notes", "Confirmed At"];
    const rows = filteredData.map((conf) => [
      `${conf.User?.block_number}-${conf.User?.room_number}`,
      conf.User?.name,
      conf.User?.phone,
      conf.User?.block_number,
      conf.breakfast ? "Yes" : "No",
      conf.lunch ? "Yes" : "No",
      conf.dinner ? "Yes" : "No",
      conf.notes || "-",
      new Date(conf.confirmed_at).toLocaleString()
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `food-confirmations-${selectedDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading confirmations...</p>
        </div>
      </Layout>
    );
  }

  const filteredConfirmations = getFilteredConfirmations();

  return (
    <Layout>
      <div className="admin-food-confirmation-page">
        <div className="food-confirmation-container">
          <div className="page-header">
            <div>
              <button className="back-btn" onClick={() => navigate("/dashboard")}>
                ← Back
              </button>
              <h2>🍽️ Food Confirmation List</h2>
            </div>
            <button className="export-btn" onClick={exportToCSV}>
              📥 Export CSV
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Date Selection */}
          <div className="date-selector">
            <label htmlFor="confirmation-date">Select Date:</label>
            <input
              type="date"
              id="confirmation-date"
              value={selectedDate}
              onChange={handleDateChange}
            />
            <span className="selected-date">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
          </div>

          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card breakfast">
              <div className="stat-icon">🌅</div>
              <div className="stat-content">
                <div className="stat-label">Breakfast</div>
                <div className="stat-number">{getMealCount("breakfast")}</div>
              </div>
            </div>
            <div className="stat-card lunch">
              <div className="stat-icon">☀️</div>
              <div className="stat-content">
                <div className="stat-label">Lunch</div>
                <div className="stat-number">{getMealCount("lunch")}</div>
              </div>
            </div>
            <div className="stat-card dinner">
              <div className="stat-icon">🌙</div>
              <div className="stat-content">
                <div className="stat-label">Dinner</div>
                <div className="stat-number">{getMealCount("dinner")}</div>
              </div>
            </div>
            <div className="stat-card total">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Total Responses</div>
                <div className="stat-number">{confirmations.length}</div>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({confirmations.length})
            </button>
            <button
              className={`filter-btn ${filter === "confirmed" ? "active" : ""}`}
              onClick={() => setFilter("confirmed")}
            >
              Confirmed ({getConfirmedCount()})
            </button>
            <button
              className={`filter-btn ${filter === "not-confirmed" ? "active" : ""}`}
              onClick={() => setFilter("not-confirmed")}
            >
              Not Confirmed ({getNotConfirmedCount()})
            </button>
          </div>

          {/* Confirmations Table */}
          {filteredConfirmations.length > 0 ? (
            <div className="confirmations-table-container">
              <table className="confirmations-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Block</th>
                    <th>🌅 Breakfast</th>
                    <th>☀️ Lunch</th>
                    <th>🌙 Dinner</th>
                    <th>Confirmed At</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConfirmations.map((confirmation) => (
                    <tr key={confirmation.id}>
                      <td>
                        <strong>
                          {confirmation.User?.room_number}
                        </strong>
                      </td>
                      <td>{confirmation.User?.name}</td>
                      <td>{confirmation.User?.phone}</td>
                      <td>{confirmation.User?.block_number}</td>
                      <td className="meal-cell">
                        <span className={confirmation.breakfast ? "yes" : "no"}>
                          {confirmation.breakfast ? "✅" : "-"}
                        </span>
                      </td>
                      <td className="meal-cell">
                        <span className={confirmation.lunch ? "yes" : "no"}>
                          {confirmation.lunch ? "✅" : "-"}
                        </span>
                      </td>
                      <td className="meal-cell">
                        <span className={confirmation.dinner ? "yes" : "no"}>
                          {confirmation.dinner ? "✅" : "-"}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(confirmation.confirmed_at).toLocaleString()}
                      </td>
                      <td className="notes-cell">{confirmation.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No confirmations for this date</p>
            </div>
          )}

          {/* Summary */}
          {filteredConfirmations.length > 0 && (
            <div className="summary-section">
              <h3>📊 Summary</h3>
              <div className="summary-content">
                <p>
                  <strong>Total Responses:</strong> {filteredConfirmations.length}
                </p>
                {filter === "all" && (
                  <>
                    <p>
                      <strong>Food Confirmed:</strong> {getConfirmedCount()} ({Math.round((getConfirmedCount() / confirmations.length) * 100)}%)
                    </p>
                    <p>
                      <strong>Food Not Needed:</strong> {getNotConfirmedCount()} ({Math.round((getNotConfirmedCount() / confirmations.length) * 100)}%)
                    </p>
                  </>
                )}
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
