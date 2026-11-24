import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFoodMenu } from "../hooks/useFoodMenu";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/FoodMenu.css";

export default function FoodMenu() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = user && (user.role === "ADMIN" || user.role === "HOSTel_ADMIN" || user.role === "HOSTEL_ADMIN" || user.role === "SUPER_ADMIN");

  const { menuForDate, fetchMenuForDate, menus, fetchMenus, loading, error } = useFoodMenu();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewType, setViewType] = useState("daily"); // 'daily' | 'weekly'

  useEffect(() => {
    if (viewType === "daily") {
      fetchMenuForDate(selectedDate);
    } else {
      fetchMenus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewType]);

  const getWeekDates = () => {
    const dates = [];
    const current = new Date();
    const day = current.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const formatLocalDate = (date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(formatLocalDate(d));
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getWeeklyData = () => {
    const weeklyData = {};
    weekDates.forEach(date => {
      weeklyData[date] = {
        BREAKFAST: [],
        LUNCH: [],
        DINNER: []
      };
    });

    (menus || []).forEach(item => {
      if (weeklyData[item.menu_date] && weeklyData[item.menu_date][item.meal_type]) {
        weeklyData[item.menu_date][item.meal_type].push(item);
      }
    });

    return weeklyData;
  };

  const weeklyGrouped = getWeeklyData();

  const groupByMealType = (items) => {
    const grouped = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: []
    };
    (items || []).forEach(item => {
      if (grouped[item.meal_type]) {
        grouped[item.meal_type].push(item);
      }
    });
    return grouped;
  };

  const dailyMenus = groupByMealType(menuForDate);

  const handlePreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-IN", options);
  };

  const formatDayName = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-IN", { weekday: "long" });
  };

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const mealIcons = {
    BREAKFAST: "🌅",
    LUNCH: "☀️",
    DINNER: "🌙"
  };

  const MealSection = ({ mealType, items }) => (
    <Card 
      title={mealType} 
      icon={mealIcons[mealType] || "🍴"} 
      className="food-meal-card"
    >
      <div className="meal-items">
        {items.length === 0 ? (
          <p className="no-items">No menu items available for {mealType.toLowerCase()}</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="meal-item">
              <div className="item-header">
                <span className="item-name">{item.item_name}</span>
                <span className={`tag ${item.is_veg ? "veg" : "non-veg"}`}>
                  {item.is_veg ? "🌱 Veg" : "🍗 Non-Veg"}
                </span>
              </div>
              {item.description && (
                <p className="item-description">{item.description}</p>
              )}
              <div className="item-status">
                {item.is_available ? (
                  <span className="available">✓ Available</span>
                ) : (
                  <span className="unavailable">✗ Not Available</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );

  return (
    <Layout>
      <div className="food-menu-container">
        <div className="menu-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <h2>🍽️ Food Menu</h2>
              <p className="subtitle">Check daily and weekly delicious meals</p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                onClick={() => navigate("/food-menu-management")}
                style={{ padding: "10px 20px" }}
              >
                ⚙️ Manage Food Menu
              </Button>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* View Toggle Tabs */}
        <div className="menu-view-tabs" style={{ display: "flex", gap: "10px", marginBottom: "25px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
          <button
            onClick={() => setViewType("daily")}
            style={{
              padding: "10px 20px",
              fontWeight: "700",
              fontSize: "14px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              background: viewType === "daily" ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "#f1f5f9",
              color: viewType === "daily" ? "#ffffff" : "#475569",
              transition: "all 0.2s ease"
            }}
          >
            📅 Daily Menu
          </button>
          <button
            onClick={() => setViewType("weekly")}
            style={{
              padding: "10px 20px",
              fontWeight: "700",
              fontSize: "14px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              background: viewType === "weekly" ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "#f1f5f9",
              color: viewType === "weekly" ? "#ffffff" : "#475569",
              transition: "all 0.2s ease"
            }}
          >
            🗓️ Weekly Food Menu
          </button>
        </div>

        {viewType === "daily" ? (
          <>
            <div className="compact-date-bar">
              <div className="date-quick-actions">
                <button onClick={handlePreviousDay} className="date-nav-btn">← Prev</button>
                <button onClick={handleToday} className="date-today-btn">Today</button>
                <button onClick={handleNextDay} className="date-nav-btn">Next →</button>
              </div>
              <div className="compact-date-badge">
                <span className="calendar-icon">📅</span>
                <span className="selected-date-title">{formatDateDisplay(selectedDate)}</span>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="compact-date-picker"
                />
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading daily menu...</div>
            ) : (
              <div className="menus-grid">
                <MealSection mealType="BREAKFAST" items={dailyMenus.BREAKFAST || []} />
                <MealSection mealType="LUNCH" items={dailyMenus.LUNCH || []} />
                <MealSection mealType="DINNER" items={dailyMenus.DINNER || []} />
              </div>
            )}
          </>
        ) : (
          /* Weekly Grid View */
          <div className="weekly-menu-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {weekDates.map(date => {
              const dayMeals = weeklyGrouped[date] || { BREAKFAST: [], LUNCH: [], DINNER: [] };
              const localTodayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
              const isToday = date === localTodayStr;

              return (
                <div
                  key={date}
                  style={{
                    background: isToday ? "#f8fafc" : "#ffffff",
                    border: isToday ? "2px solid #6366f1" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    position: "relative"
                  }}
                >
                  {isToday && (
                    <span style={{
                      position: "absolute",
                      top: "10px",
                      right: "15px",
                      background: "#6366f1",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}>
                      TODAY
                    </span>
                  )}
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", marginBottom: "15px" }}>
                    <h3 style={{ margin: "0", fontSize: "18px", color: "#1e293b" }}>{formatDayName(date)}</h3>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>{formatShortDate(date)}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Breakfast */}
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "13px", color: "#475569", fontWeight: "700" }}>🌅 Breakfast</h4>
                      {dayMeals.BREAKFAST.length > 0 ? (
                        dayMeals.BREAKFAST.map((item, idx) => (
                          <div key={idx} style={{ fontSize: "14px", color: "#0f172a" }}>
                            {item.item_name} {item.is_veg ? "🌱" : "🍖"}
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>No menu</span>
                      )}
                    </div>

                    {/* Lunch */}
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "13px", color: "#475569", fontWeight: "700" }}>☀️ Lunch</h4>
                      {dayMeals.LUNCH.length > 0 ? (
                        dayMeals.LUNCH.map((item, idx) => (
                          <div key={idx} style={{ fontSize: "14px", color: "#0f172a" }}>
                            {item.item_name} {item.is_veg ? "🌱" : "🍖"}
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>No menu</span>
                      )}
                    </div>

                    {/* Dinner */}
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "13px", color: "#475569", fontWeight: "700" }}>🌙 Dinner</h4>
                      {dayMeals.DINNER.length > 0 ? (
                        dayMeals.DINNER.map((item, idx) => (
                          <div key={idx} style={{ fontSize: "14px", color: "#0f172a" }}>
                            {item.item_name} {item.is_veg ? "🌱" : "🍖"}
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>No menu</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant="secondary"
                        onClick={() => navigate("/food-menu-management", { state: { defaultDate: date } })}
                        style={{ padding: "4px 10px", fontSize: "12px", minWidth: "auto" }}
                      >
                        ✏️ Edit Day
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
