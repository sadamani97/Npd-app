import React, { useState, useEffect } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/FoodMenu.css";

export default function FoodMenu() {
  const [menus, setMenus] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMenusForDate(selectedDate);
  }, [selectedDate]);

  const fetchMenusForDate = async (date) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/food-menus/date", { params: { date } });
      
      if (res.data.success) {
        const groupedMenus = groupByMealType(res.data.data);
        setMenus(groupedMenus);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load menu");
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const groupByMealType = (items) => {
    const grouped = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: []
    };
    
    items.forEach(item => {
      if (grouped[item.meal_type]) {
        grouped[item.meal_type].push(item);
      }
    });
    
    return grouped;
  };

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

  const MealSection = ({ mealType, items }) => (
    <div className="meal-section">
      <h3 className="meal-title">🍴 {mealType}</h3>
      <div className="meal-items">
        {items.length === 0 ? (
          <p className="no-items">No menu items available</p>
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
    </div>
  );

  return (
    <Layout>
      <div className="food-menu-container">
        <div className="menu-header">
          <h2>🍽️ Daily Food Menu</h2>
          <p className="subtitle">Check today's delicious meals</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="date-selector">
          <button onClick={handlePreviousDay} className="btn-date-nav">← Previous</button>
          <div className="date-display">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
            <span className="date-text">{formatDateDisplay(selectedDate)}</span>
          </div>
          <button onClick={handleNextDay} className="btn-date-nav">Next →</button>
          <button onClick={handleToday} className="btn-today">Today</button>
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
