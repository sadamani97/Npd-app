import React, { useState, useEffect } from "react";
import { useComplaints } from "../hooks/useComplaints";
import Layout from "../components/Layout";
import { Button, Select } from "../components/ui";
import { getCurrentUser } from "../utils/authUtils";
import "../styles/Complaints.css";

export default function Complaints() {
  const { complaints, loading, error, fetchComplaints, updateStatus, removeComplaint } = useComplaints();
  const [filtering, setFiltering] = useState("ALL");
  const user = getCurrentUser();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    const res = await updateStatus(id, newStatus);
    if (res.success) {
      fetchComplaints();
    } else {
      alert(res.message || "Failed to update complaint");
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    const res = await removeComplaint(id);
    if (res.success) {
      alert("Complaint deleted");
    } else {
      alert(res.message || "Failed to delete complaint");
    }
  };

  const filteredComplaints = filtering === "ALL" 
    ? complaints 
    : complaints.filter(c => c.status === filtering);

  return (
    <Layout>
      <div className="complaints-header">
        <h2>Resident Complaints</h2>
        
        <div className="filter-buttons" style={{ display: 'flex', gap: '8px' }}>
          <Button 
            variant={filtering === "ALL" ? "primary" : "outline"}
            onClick={() => setFiltering("ALL")}
          >
            All
          </Button>
          <Button 
            variant={filtering === "OPEN" ? "primary" : "outline"}
            onClick={() => setFiltering("OPEN")}
          >
            Open
          </Button>
          <Button 
            variant={filtering === "IN_PROGRESS" ? "primary" : "outline"}
            onClick={() => setFiltering("IN_PROGRESS")}
          >
            In Progress
          </Button>
          <Button 
            variant={filtering === "RESOLVED" ? "primary" : "outline"}
            onClick={() => setFiltering("RESOLVED")}
          >
            Resolved
          </Button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading complaints...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-state">
          <p>No complaints found</p>
        </div>
      ) : (
        <div className="complaints-grid">
          {filteredComplaints.map((complaint) => (
            <div key={complaint.id} className="complaint-card">
              <div className="complaint-header">
                <h3>{complaint.title}</h3>
                <span className={`status-badge status-${complaint.status.toLowerCase()}`}>
                  {complaint.status}
                </span>
              </div>

              <div className="complaint-body">
                <p className="category">
                  <strong>Category:</strong> {complaint.category}
                </p>
                <p className="description">{complaint.description}</p>
                
                {(complaint.user || complaint.User) && (
                  <p className="resident-info">
                    <strong>From:</strong> {(complaint.user || complaint.User).name} ({(complaint.user || complaint.User).phone})
                  </p>
                )}

                <p className="date">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </p>
              </div>

              {user.role === "ADMIN" && (
                <div className="complaint-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
                  {complaint.status !== "RESOLVED" && (
                    <Select 
                      value={complaint.status}
                      onChange={(e) => handleUpdateStatus(complaint.id, e.target.value)}
                      options={[
                        { value: 'OPEN', label: 'Open' },
                        { value: 'IN_PROGRESS', label: 'In Progress' },
                        { value: 'RESOLVED', label: 'Resolved' }
                      ]}
                    />
                  )}
                  <Button 
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteComplaint(complaint.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
