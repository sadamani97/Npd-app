import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import "../styles/BlocksHierarchy.css";
import { Button, Alert } from "../components/ui";

export default function BlocksPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/rooms/blocks");
        if (!res.data.success) {
          setError("Could not load blocks");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load blocks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableBlocks = ["1", "2"];

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading blocks...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blocks-page-simple blocks-hierarchy">
        <div className="hierarchy-header">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
          <h2>🏢 Blocks</h2>
          <p className="hierarchy-sub">{availableBlocks.length} block(s)</p>
        </div>

        <Alert>{error}</Alert>

        <div className="blocks-simple-grid">
          {availableBlocks.map((num) => (
            <Button
              key={String(num)}
              className="block-simple-card"
              variant="secondary"
              onClick={() => navigate(`/block/${encodeURIComponent(num)}`)}
            >
              <div className="block-simple-header">
                <h3>Block {num}</h3>
              </div>
              <p className="block-simple-hint">View floors and manage rooms →</p>
            </Button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
