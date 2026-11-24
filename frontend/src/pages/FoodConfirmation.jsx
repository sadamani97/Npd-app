import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import "../styles/FoodConfirmation.css";

export default function FoodConfirmation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    confirmation_date: "",
    breakfast: false,
    lunch: false,
    dinner: false,
    notes: ""
  });
  const [existingConfirmation, setExistingConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      confirmation_date: formattedDate
    }));

    checkExistingConfirmation(formattedDate);
  }, []);

  const checkExistingConfirmation = async (date) => {
    try {
      const res = await API.get("/food-confirmations/user/date", {
        params: { confirmation_date: date }
      });
      if (res.data.success && res.data.data) {
        setExistingConfirmation(res.data.data);
        setFormData((prev) => ({
          ...prev,
          breakfast: res.data.data.breakfast || false,
          lunch: res.data.data.lunch || false,
          dinner: res.data.data.dinner || false,
          notes: res.data.data.notes || ""
        }));
      } else {
        setExistingConfirmation(null);
        setFormData((prev) => ({
          ...prev,
          breakfast: false,
          lunch: false,
          dinner: false,
          notes: ""
        }));
      }
    } catch (err) {
      console.error("Error checking confirmation:", err);
      setExistingConfirmation(null);
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setFormData((prev) => ({
      ...prev,
      confirmation_date: selectedDate
    }));
    checkExistingConfirmation(selectedDate);
  };

  const handleMealChange = (meal) => {
    setFormData((prev) => ({
      ...prev,
      [meal]: !prev[meal]
    }));
  };

  const handleNotesChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      notes: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.breakfast && !formData.lunch && !formData.dinner) {
      setError("Please select at least one meal to confirm");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await API.post("/food-confirmations", formData);

      if (res.data.success) {
        const meals = [];
        if (formData.breakfast) meals.push("Breakfast");
        if (formData.lunch) meals.push("Lunch");
        if (formData.dinner) meals.push("Dinner");

        setSuccessMessage(`✅ Meal confirmation recorded for ${meals.join(", ")}`);
        setExistingConfirmation(res.data.data);

        setTimeout(() => {
          navigate("/user-dashboard");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit confirmation");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!existingConfirmation) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await API.post("/food-confirmations/cancel", {
        confirmation_date: formData.confirmation_date
      });

      if (res.data.success) {
        setSuccessMessage("✅ Meal confirmation cancelled");
        setFormData((prev) => ({
          ...prev,
          breakfast: false,
          lunch: false,
          dinner: false,
          notes: ""
        }));
        setExistingConfirmation(null);

        setTimeout(() => {
          navigate("/user-dashboard");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel confirmation");
    } finally {
      setLoading(false);
    }
  };

  const MealCardToggle = ({ meal, label, icon, subtitle }) => (
    <div 
      className={`meal-card-toggle ${formData[meal] ? "active-meal" : ""}`}
      onClick={() => handleMealChange(meal)}
    >
      <div className="meal-card-icon">{icon}</div>
      <div className="meal-card-info">
        <h4>{label}</h4>
        <span>{subtitle}</span>
      </div>
      <div className="meal-card-checkbox">
        {formData[meal] ? "✅ Selected" : "+ Add Meal"}
      </div>
    </div>
  );

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <Layout>
      <div className="food-confirmation-web-page">
        <div className="confirmation-web-container">
          <div className="confirmation-header">
            <button className="back-btn" onClick={() => navigate("/user-dashboard")}>
              ← Back
            </button>
            <div>
              <h2>🍽️ Food Confirmation System</h2>
              <p className="header-subtitle">Confirm your daily meal attendance for tomorrow</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <div className="confirmation-web-grid">
            {/* Form Section */}
            <Card className="form-card-web">
              <form onSubmit={handleSubmit} className="confirmation-form-web">
                <div className="form-group">
                  <label htmlFor="confirmation_date">Target Confirmation Date</label>
                  <div className="date-picker-row">
                    <input
                      type="date"
                      id="confirmation_date"
                      min={getMinDate()}
                      value={formData.confirmation_date}
                      onChange={handleDateChange}
                      required
                      className="date-input-web"
                    />
                    <span className="date-hint-badge">{getTomorrowDate()}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Meals Required</label>
                  <div className="meals-grid-web">
                    <MealCardToggle meal="breakfast" label="Breakfast" icon="🌅" subtitle="Morning Meal" />
                    <MealCardToggle meal="lunch" label="Lunch" icon="☀️" subtitle="Afternoon Meal" />
                    <MealCardToggle meal="dinner" label="Dinner" icon="🌙" subtitle="Night Meal" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Special Dietary Notes (Optional)</label>
                  <textarea
                    id="notes"
                    rows="3"
                    placeholder="E.g. Vegetarian preference, allergies, or special notes..."
                    value={formData.notes}
                    onChange={handleNotesChange}
                    className="notes-input-web"
                  />
                </div>

                {existingConfirmation && (
                  <div className="info-box-web">
                    <p>
                      <strong>Current Confirmed Status:</strong>{" "}
                      {[
                        existingConfirmation.breakfast && "Breakfast 🌅",
                        existingConfirmation.lunch && "Lunch ☀️",
                        existingConfirmation.dinner && "Dinner 🌙"
                      ].filter(Boolean).join(" | ") || "None"}
                    </p>
                  </div>
                )}

                <div className="button-group-web">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="confirm-btn-web"
                  >
                    {loading ? "Saving..." : "✅ Confirm Meal Choices"}
                  </Button>
                  {existingConfirmation && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleCancel}
                      disabled={loading}
                      className="cancel-btn-web"
                    >
                      ❌ Cancel Confirmation
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {/* Sidebar Guidelines */}
            <div className="side-guidelines">
              <Card title="📌 Meal Rules & Guidelines" icon="📌">
                <ul className="guidelines-list">
                  <li>Please confirm your meals at least <strong>one day in advance</strong>.</li>
                  <li>Confirmations help prevent food wastage.</li>
                  <li>Cancellations after 2 PM may not be updated for mess preparation.</li>
                  <li>Your preferences are automatically updated in admin meal counts.</li>
                </ul>
              </Card>

              <Card title="ℹ️ Confirmation Status" icon="📊" className="status-card-web">
                <p>
                  Date: <strong>{formData.confirmation_date || "Tomorrow"}</strong>
                </p>
                <p>
                  Selected: <strong>
                    {[
                      formData.breakfast && "Breakfast",
                      formData.lunch && "Lunch",
                      formData.dinner && "Dinner"
                    ].filter(Boolean).join(", ") || "None"}
                  </strong>
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
