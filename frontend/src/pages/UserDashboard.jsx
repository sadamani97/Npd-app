import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCirculars } from "../hooks/useCirculars";
import { useComplaints } from "../hooks/useComplaints";
import { useFoodMenu } from "../hooks/useFoodMenu";
import Layout from "../components/Layout";
import { Card, Button, Alert } from "../components/ui";
import "../styles/UserDashboard.css";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const [activeView, setActiveView] = useState("overview");
  const { circulars, fetchCirculars, loading: circLoading } = useCirculars();
  const { complaints, fetchComplaints, loading: compLoading } = useComplaints();
  const { menuForDate: todayMenu, fetchMenuForDate, loading: menuLoading, error: menuError } = useFoodMenu();

  const loading = circLoading || compLoading || menuLoading;
  const error = menuError;

  const recentCirculars = (circulars || []).slice(0, 3);
  const recentComplaints = (complaints || []).slice(0, 3);

  // Late Fee & Rent Calculation Logic
  const today = new Date();
  const currentDay = today.getDate(); // Day of month (1-31)
  const isAfter10th = currentDay > 10;
  const penaltyDays = isAfter10th ? currentDay - 10 : 0;
  const lateFeePenalty = penaltyDays * 100; // ₹100 per day past 10th

  const getSharingRentAmount = (roomType, acStatus, isPremium, userRent) => {
    if (userRent && Number(userRent) > 0) return Number(userRent);
    const typeStr = String(roomType || "").toUpperCase();
    const ac = String(acStatus || "").toUpperCase() === "AC";
    const prem = Boolean(isPremium);

    if (typeStr.includes("1") || typeStr.includes("SINGLE")) {
      if (prem) return 19999;
      if (ac) return 10500;
      return 9500;
    }
    if (typeStr.includes("2") || typeStr.includes("DOUBLE")) {
      if (prem) return 14999;
      if (ac) return 7750;
      return 7000;
    }
    if (typeStr.includes("3") || typeStr.includes("TRIPLE")) {
      if (prem) return 9999;
      if (ac) return 7500;
      return 6750;
    }
    if (typeStr.includes("4") || typeStr.includes("FOUR")) {
      if (ac) return 7250;
      return 6500;
    }
    if (typeStr.includes("5") || typeStr.includes("FIVE")) return 6250;
    if (typeStr.includes("6") || typeStr.includes("SIX")) return 6000;

    return 6000;
  };

  const baseRent = getSharingRentAmount(
    user?.room_type || user?.sharing_type,
    user?.ac_status,
    user?.is_premium,
    user?.rent_amount || user?.rent
  );
  const electricityCharges = Number(user?.electricity_charges || 0);
  const totalPayable = baseRent + electricityCharges + lateFeePenalty;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    await Promise.allSettled([
      fetchCirculars(),
      fetchComplaints(),
      fetchMenuForDate(todayStr)
    ]);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayWithRazorpay = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Razorpay SDK failed to load. Please check internet connection.");
      return;
    }

    const options = {
      key: "rzp_test_mockkey12345",
      amount: totalPayable * 100, // Amount in paise
      currency: "INR",
      name: "Hostel Management System",
      description: `Rent & EB Payment for ${user.name || "Resident"}`,
      image: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
      handler: function (response) {
        alert(`🎉 Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: user.name || "Resident",
        email: user.email || "user@hostel.com",
        contact: user.phone || "9999999999"
      },
      theme: {
        color: "#6366f1"
      }
    };

    try {
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (e) {
      alert(`Initiating Payment for ₹${totalPayable}... (Razorpay Test Checkout)`);
    }
  };

  const renderOverview = () => (
    <div className="user-dashboard-overview">
      {/* Welcome Banner Card */}
      <Card variant="welcome" className="welcome-user-card">
        <div className="welcome-banner-content">
          <h2>Welcome, {user.name || "Resident"}! 👋</h2>
          <div className="user-details-pills">
            <span className="user-pill">Block {user.block_number || "1"}</span>
            <span className="user-pill">Floor {user.floor_number || "1"}</span>
            <span className="user-pill">Room {user.room_number || "101"}</span>
            <span className="user-pill highlight">Sharing: {user.room_type || user.sharing_type || "4 Sharing"}</span>
          </div>
        </div>
      </Card>

      {/* Rent & Electricity Payment Card */}
      <Card
        title="💳 Rent & Electricity Payment"
        subtitle={`Billing Month: ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
        variant={isAfter10th ? "warning" : "default"}
        className="rent-payment-card"
      >
        <div className="rent-details-content">
          <div className="rent-breakdown-grid">
            <div className="rent-item">
              <span className="rent-item-label">Monthly Sharing Rent</span>
              <span className="rent-item-value">₹{baseRent.toLocaleString()}</span>
            </div>
            <div className="rent-item">
              <span className="rent-item-label">Electricity Charges</span>
              <span className="rent-item-value">₹{electricityCharges.toLocaleString()}</span>
            </div>
            {isAfter10th && (
              <div className="rent-item penalty-item">
                <span className="rent-item-label">Late Fee Penalty ({penaltyDays} days past 10th × ₹100)</span>
                <span className="rent-item-value penalty-text">+₹{lateFeePenalty.toLocaleString()}</span>
              </div>
            )}
            <div className="rent-item total-item">
              <span className="rent-item-label">Total Payable Amount</span>
              <span className="rent-item-value total-text">₹{totalPayable.toLocaleString()}</span>
            </div>
          </div>

          {/* Late Rent Warning / Payment Notice Banner */}
          <div className={`rent-notice-banner ${isAfter10th ? "penalty-warning" : "normal-notice"}`}>
            {isAfter10th ? (
              <p>
                ⚠️ <strong>Overdue Warning:</strong> Rent payment was due on the 10th. A late fee penalty of <strong>₹100/day</strong> is being added daily starting from the 11th. Please pay immediately.
              </p>
            ) : (
              <p>
                ℹ️ <strong>Payment Reminder:</strong> Please pay your rent before the <strong>10th of this month</strong> to avoid a late fee penalty of ₹100 per day.
              </p>
            )}
          </div>

          <div className="rent-action-row">
            <Button className="razorpay-btn" onClick={handlePayWithRazorpay}>
              Pay ₹{totalPayable.toLocaleString()} via Razorpay 💳
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Grid Interactive Nav Cards */}
      <div className="dashboard-grid">
        <Card
          title="📢 Recent Announcements"
          icon="📢"
          subtitle="Hostel circulars and notices"
          clickable
          onClick={() => navigate("/user-circulars")}
          className="nav-card"
        >
          <div className="card-content">
            {recentCirculars.length > 0 ? (
              recentCirculars.map((circular) => (
                <div key={circular.id} className="item">
                  <h4>{circular.title}</h4>
                  <p>{circular.message}</p>
                  <small>{new Date(circular.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            ) : (
              <p className="empty-text">No announcements yet</p>
            )}
            <div className="card-link-footer">View All Announcements →</div>
          </div>
        </Card>

        <Card
          title="📋 Today's Menu"
          icon="📋"
          subtitle="Check daily meals menu"
          clickable
          onClick={() => navigate("/food-menu")}
          className="nav-card"
        >
          <div className="card-content">
            {todayMenu.length > 0 ? (
              Object.entries(
                todayMenu.reduce((acc, item) => {
                  if (!acc[item.meal_type]) acc[item.meal_type] = [];
                  acc[item.meal_type].push(item);
                  return acc;
                }, {})
              ).map(([mealType, items]) => (
                <div key={mealType} className="menu-preview-group">
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
              <p className="empty-text">No menu available for today</p>
            )}
            <div className="card-link-footer">View Full Menu →</div>
          </div>
        </Card>

        <Card
          title="📝 My Complaints"
          icon="📝"
          subtitle="Track & log maintenance issues"
          clickable
          onClick={() => navigate("/user-complaints")}
          className="nav-card"
        >
          <div className="card-content">
            {recentComplaints.length > 0 ? (
              recentComplaints.map((complaint) => (
                <div key={complaint.id} className="complaint-item">
                  <h4>{complaint.title}</h4>
                  <span className={`status-badge ${complaint.status?.toLowerCase()}`}>
                    {complaint.status}
                  </span>
                  <small>{new Date(complaint.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            ) : (
              <p className="empty-text">No complaints yet</p>
            )}
            <div className="card-link-footer">View All Complaints →</div>
          </div>
        </Card>

        <Card
          title="🍽️ Food Confirmation"
          icon="🍽️"
          subtitle="Daily meal confirmations"
          clickable
          onClick={() => navigate("/food-confirmation")}
          className="nav-card"
        >
          <div className="card-content">
            <p>Confirm or cancel your breakfast, lunch, and dinner preferences for tomorrow.</p>
            <Button
              className="primary-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/food-confirmation");
              }}
            >
              Submit Confirmation
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading User Dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-dashboard">
        {error && <Alert variant="danger">{error}</Alert>}
        {activeView === "overview" && renderOverview()}
      </div>
    </Layout>
  );
}
