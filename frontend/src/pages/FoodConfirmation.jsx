import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
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
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      confirmation_date: formattedDate
    }));

    // Check if user already submitted for tomorrow
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
        // Reset form for new date
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
    
    // Check if at least one meal is selected
    if (!formData.breakfast && !formData.lunch && !formData.dinner) {
      setError("Please select at least one meal");
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

        setSuccessMessage(`✅ Confirmed: ${meals.join(", ")}`);
        setExistingConfirmation(res.data.data);

        setTimeout(() => {
          navigate("/user-dashboard");
        }, 2000);
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
        setSuccessMessage("✅ Confirmation cancelled");
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
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel confirmation");
    } finally {
      setLoading(false);
    }
  };

  const MealCheckbox = ({ meal, label, icon }) => (
    <div className="meal-checkbox-wrapper">
      <label className={`meal-checkbox ${formData[meal] ? "checked" : ""}`}>
        <input
          type="checkbox"
          checked={formData[meal]}
          onChange={() => handleMealChange(meal)}
        />
        <div className="meal-content">
          <span className="icon">{icon}</span>
          <span className="label">{label}</span>
        </div>
      </label>
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
      <div className="food-confirmation-page">
        <div className="confirmation-container">
          <div className="confirmation-header">
            <button className="back-btn" onClick={() => navigate("/user-dashboard")}>
              ← Back
            </button>
            <h2>🍽️ Confirm Meals</h2>
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="confirmation-form">
            {/* Date Selection */}
            <div className="form-group">
              <label htmlFor="confirmation_date">Select Date</label>
              <input
                type="date"
                id="confirmation_date"
                min={getMinDate()}
                value={formData.confirmation_date}
                onChange={handleDateChange}
                required
              />
              <small className="form-hint">
                {getTomorrowDate()}
              </small>
            </div>

            {/* Meal Selection */}
            <div className="form-group">
              <label>Select Meals Needed</label>
              <div className="meals-grid">
                <MealCheckbox meal="breakfast" label="Breakfast" icon="🌅" />
                <MealCheckbox meal="lunch" label="Lunch" icon="☀️" />
                <MealCheckbox meal="dinner" label="Dinner" icon="🌙" />
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes">Additional Notes (Optional)</label>
              <textarea
                id="notes"
                rows="4"
                placeholder="Any special dietary requirements or additional notes..."
                value={formData.notes}
                onChange={handleNotesChange}
              />
            </div>

            {/* Status Info */}
            {existingConfirmation && (
              <div className="info-box">
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(existingConfirmation.confirmed_at).toLocaleString()}
                </p>
                <p>
                  <strong>Current Meals:</strong>{" "}
                  {[
                    existingConfirmation.breakfast && "Breakfast",
                    existingConfirmation.lunch && "Lunch",
                    existingConfirmation.dinner && "Dinner"
                  ].filter(Boolean).join(", ") || "None"}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="button-group">
              <button
                type="submit"
                disabled={loading}
                className={`submit-btn ${loading ? "loading" : ""}`}
              >
                {loading ? "Submitting..." : "✅ Confirm Meals"}
              </button>
              {existingConfirmation && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="cancel-btn"
                >
                  ❌ Cancel Confirmation
                </button>
              )}
            </div>
          </form>

          {/* Info Card */}
          <div className="info-card">
            <h3>📌 Important Information</h3>
            <ul>
              <li>Select the meals you need for the selected date</li>
              <li>Changes made after 2 PM may not be processed</li>
              <li>Admin will see your confirmation in the food list</li>
              <li>You can update your selections up to tomorrow morning</li>
              <li>At least one meal must be selected to confirm</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
