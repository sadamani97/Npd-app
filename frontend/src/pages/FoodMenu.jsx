import React, { useState, useEffect } from "react";
import { useFoodMenu } from "../hooks/useFoodMenu";
import Layout from "../components/Layout";
import { Card } from "../components/ui";
import "../styles/FoodMenu.css";

export default function FoodMenu() {
  const { menuForDate, fetchMenuForDate, loading, error } = useFoodMenu();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchMenuForDate(selectedDate);
  }, [selectedDate]);

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

  const menus = groupByMealType(menuForDate);

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
          <h2>🍽️ Daily Food Menu</h2>
          <p className="subtitle">Check today's delicious meals</p>
        </div>

        {error && <div className="error-message">{error}</div>}

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
          <div className="loading">Loading menu...</div>
        ) : (
          <div className="menus-grid">
            <MealSection mealType="BREAKFAST" items={menus.BREAKFAST || []} />
            <MealSection mealType="LUNCH" items={menus.LUNCH || []} />
            <MealSection mealType="DINNER" items={menus.DINNER || []} />
          </div>
        )}
      </div>
    </Layout>
  );
}
