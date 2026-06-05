import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/UserDashboard.css";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [activeView, setActiveView] = useState("overview");
  const [circulars, setCirculars] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [todayMenu, setTodayMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch circulars
      try {
        const circularsRes = await API.get("/circulars");
        if (circularsRes.data.success && Array.isArray(circularsRes.data.data)) {
          setCirculars(circularsRes.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Circulars fetch error:", err);
      }

      // Fetch user's complaints
      try {
        const complaintsRes = await API.get("/complaints");
        if (complaintsRes.data.success && Array.isArray(complaintsRes.data.data)) {
          setComplaints(complaintsRes.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Complaints fetch error:", err);
      }

      // Get today's menu
      try {
        const today = new Date().toISOString().split("T")[0];
        const menuRes = await API.get("/food-menus/date", { params: { date: today } });
        if (menuRes.data.success && Array.isArray(menuRes.data.data)) {
          setTodayMenu(menuRes.data.data);
        }
      } catch (err) {
        console.error("Food menu fetch error:", err);
        // Don't show error if menu is not available
        if (err.response?.status !== 404) {
          console.error("Error fetching menu:", err.message);
        }
      }
    } catch (err) {
      setError("Failed to load some dashboard data. Please refresh the page.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="user-dashboard-overview">
      <div className="welcome-card">
        <h2>Welcome, {user.name || "Guest"}! 👋</h2>
        <p>Block {user.block_number || "N/A"} | Floor {user.floor_number || "N/A"} | Room {user.room_number || "N/A"}</p>
        <p className="room-type">{user.room_type || "N/A"}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>📢 Recent Announcements</h3>
          <div className="card-content">
            {circulars.length > 0 ? (
              circulars.map((circular) => (
                <div key={circular.id} className="item">
                  <h4>{circular.title}</h4>
                  <p>{circular.message}</p>
                  <small>{new Date(circular.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            ) : (
              <p>No announcements yet</p>
            )}
            <button className="view-more-btn" onClick={() => setActiveView("announcements")}>
              View All Announcements →
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>📋 Today's Menu</h3>
          <div className="card-content">
            {todayMenu.length > 0 ? (
              todayMenu.reduce((acc, item) => {
                if (!acc[item.meal_type]) acc[item.meal_type] = [];
                acc[item.meal_type].push(item);
                return acc;
              }, {}) &&
              Object.entries(
                todayMenu.reduce((acc, item) => {
                  if (!acc[item.meal_type]) acc[item.meal_type] = [];
                  acc[item.meal_type].push(item);
                  return acc;
                }, {})
              ).map(([mealType, items]) => (
                <div key={mealType}>
                  <h5>{mealType}</h5>
                  <ul>
                    {items.map((item) => (
                      <li key={item.id}>
                        {item.item_name} {item.is_veg ? "🌱" : "🍖"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p>No menu available for today</p>
            )}
            <button className="view-more-btn" onClick={() => setActiveView("menu")}>
              View Full Menu →
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>📝 My Complaints</h3>
          <div className="card-content">
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <div key={complaint.id} className="complaint-item">
                  <h4>{complaint.title}</h4>
                  <span className={`status-badge ${complaint.status?.toLowerCase()}`}>
                    {complaint.status}
                  </span>
                  <small>{new Date(complaint.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            ) : (
              <p>No complaints yet</p>
            )}
            <button className="view-more-btn" onClick={() => setActiveView("complaints")}>
              View All Complaints →
            </button>
          </div>
        </div>

        <div className="dashboard-card last-card">
          <h3>🍽️ Food Confirmation</h3>
          <p>Confirm or cancel your food for tomorrow</p>
          <button
            className="primary-btn"
            onClick={() => setActiveView("food-confirmation")}
          >
            Submit Confirmation
          </button>
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="section">
      <div className="section-header">
        <button className="back-btn" onClick={() => setActiveView("overview")}>
          ← Back
        </button>
        <h2>🍽️ Food Menu</h2>
      </div>
      <div className="menu-container">
        {todayMenu.length > 0 ? (
          Object.entries(
            todayMenu.reduce((acc, item) => {
              if (!acc[item.meal_type]) acc[item.meal_type] = [];
              acc[item.meal_type].push(item);
              return acc;
            }, {})
          ).map(([mealType, items]) => (
            <div key={mealType} className="meal-section">
              <h3>{mealType}</h3>
              <div className="menu-items">
                {items.map((item) => (
                  <div key={item.id} className="menu-item-card">
                    <h4>{item.item_name}</h4>
                    {item.description && <p>{item.description}</p>}
                    <span className="veg-badge">{item.is_veg ? "Veg 🌱" : "Non-Veg 🍖"}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No menu available</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-dashboard">
        {error && <div className="error-message">{error}</div>}

        {activeView === "overview" && renderOverview()}
        {activeView === "menu" && renderMenu()}
      </div>
    </Layout>
  );
}
