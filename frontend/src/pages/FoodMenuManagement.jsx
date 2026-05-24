import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/FoodMenuManagement.css";

export default function FoodMenuManagement() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    menu_date: "",
    meal_type: "BREAKFAST",
    item_name: "",
    description: "",
    is_veg: true,
    is_available: true
  });

  useEffect(() => {
    if (user.role !== "ADMIN") {
      navigate("/user-dashboard");
      return;
    }
    fetchMenusForDate(selectedDate);
  }, []);

  useEffect(() => {
    fetchMenusForDate(selectedDate);
  }, [selectedDate]);

  const fetchMenusForDate = async (date) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/food-menus", {
        params: { date }
      });
      
      if (res.data.success) {
        // Filter by date on frontend
        const filtered = res.data.data.filter(menu => menu.menu_date === date);
        setMenus(filtered);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load menus");
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.item_name.trim()) {
      setError("Item name is required");
      return;
    }

    const submitData = {
      ...formData,
      menu_date: selectedDate
    };

    try {
      if (editingId) {
        // Update existing menu
        const res = await API.put(`/food-menus/${editingId}`, submitData);
        if (res.data.success) {
          setMenus(menus.map(m => m.id === editingId ? res.data.data : m));
          setShowForm(false);
          setEditingId(null);
          resetForm();
        }
      } else {
        // Create new menu
        const res = await API.post("/food-menus", submitData);
        if (res.data.success) {
          setMenus([...menus, res.data.data]);
          setShowForm(false);
          resetForm();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save menu item");
    }
  };

  const handleEdit = (menu) => {
    setFormData({
      menu_date: menu.menu_date,
      meal_type: menu.meal_type,
      item_name: menu.item_name,
      description: menu.description,
      is_veg: menu.is_veg,
      is_available: menu.is_available
    });
    setEditingId(menu.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const res = await API.delete(`/food-menus/${id}`);
      if (res.data.success) {
        setMenus(menus.filter(m => m.id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete menu item");
    }
  };

  const resetForm = () => {
    setFormData({
      menu_date: "",
      meal_type: "BREAKFAST",
      item_name: "",
      description: "",
      is_veg: true,
      is_available: true
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
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

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-IN", options);
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

  const groupedMenus = groupByMealType(menus);

  return (
    <Layout>
      <div className="food-menu-management-container">
        <div className="page-header">
          <div>
            <button className="back-btn" onClick={() => navigate("/dashboard")}>
              ← Back
            </button>
            <h2>🍽️ Food Menu Management</h2>
            <p className="subtitle">Create daily food menus for residents</p>
          </div>
          <button
            className="add-btn"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? "✕ Cancel" : "➕ Add Menu Item"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Date Navigation */}
        <div className="date-selector">
          <button onClick={handlePreviousDay} className="btn-date-nav">
            ← Previous
          </button>
          <div className="date-display">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="date-input"
            />
            <span className="date-text">{formatDateDisplay(selectedDate)}</span>
          </div>
          <button onClick={handleNextDay} className="btn-date-nav">
            Next →
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="btn-today"
          >
            Today
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="menu-form-container">
            <div className="menu-form">
              <h3>{editingId ? "Edit Menu Item" : "Add New Menu Item"}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Meal Type</label>
                    <select
                      name="meal_type"
                      value={formData.meal_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="BREAKFAST">🌅 Breakfast</option>
                      <option value="LUNCH">☀️ Lunch</option>
                      <option value="DINNER">🌙 Dinner</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Item Name</label>
                    <input
                      type="text"
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Paneer Butter Masala"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g., Served with rice, Roti, Dal"
                    rows="3"
                  />
                </div>

                <div className="form-row checkbox-row">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="is_veg"
                      name="is_veg"
                      checked={formData.is_veg}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="is_veg">
                      {formData.is_veg ? "🌱 Vegetarian" : "🍗 Non-Vegetarian"}
                    </label>
                  </div>

                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="is_available"
                      name="is_available"
                      checked={formData.is_available}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="is_available">
                      {formData.is_available ? "✓ Available" : "✗ Not Available"}
                    </label>
                  </div>
                </div>

                <div className="form-buttons">
                  <button type="submit" className="btn-submit">
                    {editingId ? "Update Item" : "Add Item"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menus Display */}
        {loading ? (
          <div className="loading">Loading menu...</div>
        ) : (
          <div className="menus-display">
            {menus.length === 0 ? (
              <div className="no-menus">
                <p>📭 No food menus available for this date</p>
                <p className="hint">Click "Add Menu Item" to create one</p>
              </div>
            ) : (
              <div className="meals-grid">
                {["BREAKFAST", "LUNCH", "DINNER"].map((mealType) => (
                  <div key={mealType} className="meal-section">
                    <div className="meal-header">
                      <h3>
                        {mealType === "BREAKFAST"
                          ? "🌅 Breakfast"
                          : mealType === "LUNCH"
                          ? "☀️ Lunch"
                          : "🌙 Dinner"}
                      </h3>
                      <span className="meal-count">
                        {groupedMenus[mealType].length} items
                      </span>
                    </div>
                    <div className="meal-items">
                      {groupedMenus[mealType].length === 0 ? (
                        <p className="no-items">No items for this meal</p>
                      ) : (
                        groupedMenus[mealType].map((menu) => (
                          <div
                            key={menu.id}
                            className={`menu-card ${
                              !menu.is_available ? "unavailable" : ""
                            }`}
                          >
                            <div className="menu-card-header">
                              <h4>{menu.item_name}</h4>
                              <div className="menu-tags">
                                <span
                                  className={`tag ${
                                    menu.is_veg ? "veg" : "non-veg"
                                  }`}
                                >
                                  {menu.is_veg ? "🌱 Veg" : "🍗 Non-Veg"}
                                </span>
                                <span
                                  className={`tag ${
                                    menu.is_available
                                      ? "available"
                                      : "unavailable"
                                  }`}
                                >
                                  {menu.is_available
                                    ? "✓ Available"
                                    : "✗ Unavailable"}
                                </span>
                              </div>
                            </div>
                            {menu.description && (
                              <p className="menu-description">
                                {menu.description}
                              </p>
                            )}
                            <div className="menu-actions">
                              <button
                                className="btn-edit"
                                onClick={() => handleEdit(menu)}
                              >
                                ✎ Edit
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(menu.id)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
