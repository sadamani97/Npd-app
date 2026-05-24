import React, { useState, useEffect } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/VacatedList.css";

export default function VacatedList() {
  const [vacatedUsers, setVacatedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVacatedUsers();
  }, []);

  const fetchVacatedUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users/vacated");
      
      if (res.data.success) {
        setVacatedUsers(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vacated list");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="vacated-header">
        <h2>Vacated Residents List</h2>
        <p className="subtitle">Archive of residents who have vacated</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading vacated list...</div>
      ) : vacatedUsers.length === 0 ? (
        <div className="empty-state">
          <p>No vacated residents yet</p>
        </div>
      ) : (
        <div className="vacated-table-container">
          <table className="vacated-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Occupation</th>
                <th>Father Phone</th>
                <th>Vacated Date</th>
              </tr>
            </thead>
            <tbody>
              {vacatedUsers.map((resident) => (
                <tr key={resident.id}>
                  <td>{resident.name}</td>
                  <td>{resident.phone}</td>
                  <td>{resident.email}</td>
                  <td>{resident.occupation}</td>
                  <td>{resident.father_phone || "-"}</td>
                  <td>
                    {new Date(resident.vacatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
