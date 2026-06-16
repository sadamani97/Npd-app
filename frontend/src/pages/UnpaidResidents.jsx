import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { usePayments } from "../hooks/usePayments";
import { Button, Alert } from "../components/ui";
import "../styles/Dashboard.css";
import "../styles/ResidentsList.css";

export default function UnpaidResidents() {
  const navigate = useNavigate();
  const { payments, fetchCurrentMonthPayments, loading, error } = usePayments();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCurrentMonthPayments();
  }, []);

  const unpaidResidents = payments?.filter(
    (p) => p.payment_status === "PENDING" || p.payment_status === "OVERDUE"
  ) || [];

  const filteredResidents = unpaidResidents.filter((resident) =>
    [
      resident.name,
      resident.phone,
      resident.block_number,
      resident.room_number,
    ].some((val) =>
      String(val || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Layout>
      <div className="dashboard-header">
        <div>
          <h2>💳 Unpaid Residents</h2>
          <p className="header-subtitle">
            Residents with pending or overdue rent payments for the current month.
          </p>
        </div>
        <div className="dashboard-search">
          <input
            type="text"
            placeholder="Search name, phone, block, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dashboard-search-input"
          />
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="section-card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="empty-state">
            <p>No unpaid residents found.</p>
          </div>
        ) : (
          <div className="residents-table-wrapper">
            <table className="residents-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Phone</th>
                  <th>Total Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident) => (
                  <tr key={resident.id}>
                    <td className="name-cell">
                      <strong>{resident.name}</strong>
                    </td>
                    <td className="block-cell">
                      <span className="block-badge-table">
                        Block {resident.block_number || "N/A"}
                      </span>
                    </td>
                    <td>Room {resident.room_number || "-"}</td>
                    <td>{resident.phone}</td>
                    <td>₹{resident.total_charges || 0}</td>
                    <td>
                      <span
                        className={`status-badge status-${resident.payment_status?.toLowerCase()}`}
                      >
                        {resident.payment_status}
                      </span>
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="secondary"
                        className="btn-sm btn-info"
                        onClick={() => navigate(`/payment-tracking/${resident.id}`)}
                      >
                        View Payments
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
