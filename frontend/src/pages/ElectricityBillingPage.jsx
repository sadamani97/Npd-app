import React, { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Button, Select, Input, Alert } from "../components/ui";
import "../styles/ElectricityBilling.css";

const toDateString = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "-";
  }
};

export default function ElectricityBillingPage() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [meters, setMeters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMeterId, setSavingMeterId] = useState(null);
  const [error, setError] = useState("");
  const [meterForm, setMeterForm] = useState({ current_reading: "", rate_per_unit: "14" });
  const [editingMeterId, setEditingMeterId] = useState(null);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/rooms/blocks");
      const blockList = res.data.data || [];
      setBlocks(blockList.map((item) => String(item.block_number || "")).filter(Boolean));
      if (!selectedBlock && blockList.length > 0) {
        setSelectedBlock(String(blockList[0].block_number || ""));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load blocks");
    } finally {
      setLoading(false);
    }
  };

  const fetchMeters = async (blockNumber) => {
    if (!blockNumber) return;
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/electricity-meters/block/${encodeURIComponent(blockNumber)}`);
      setMeters(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load meters");
      setMeters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (blockNumber) => {
    if (!blockNumber) return;
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/rooms/block/${encodeURIComponent(blockNumber)}`);
      setRooms(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (selectedBlock) {
      fetchMeters(selectedBlock);
      fetchRooms(selectedBlock);
    }
  }, [selectedBlock]);

  const beginEditingMeter = (meter) => {
    setEditingMeterId(meter.id);
    setMeterForm({
      current_reading: meter.current_reading || "",
      rate_per_unit: meter.rate_per_unit || "14",
      reading_date: meter.last_reading_date
        ? new Date(meter.last_reading_date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    });
    setError("");
  };

  const cancelEditing = () => {
    setEditingMeterId(null);
    setMeterForm({ current_reading: "", rate_per_unit: "14" });
    setError("");
  };

  const handleMeterChange = (event) => {
    const { name, value } = event.target;
    setMeterForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveMeterReading = async (meterId) => {
    try {
      setSavingMeterId(meterId);
      setError("");
      const payload = {
        current_reading: Number(meterForm.current_reading),
        rate_per_unit: Number(meterForm.rate_per_unit)
      };
      if (meterForm.reading_date) payload.reading_date = meterForm.reading_date;

      // capture room info before refresh
      const meterInfo = meters.find((m) => m.id === meterId) || {};

      await API.put(`/electricity-meters/${meterId}/reading`, payload);
      await fetchMeters(selectedBlock);
      cancelEditing();

      // notify other pages to refresh (room/resident pages)
      try {
        const detail = { block: meterInfo.block_number || selectedBlock, room: meterInfo.room_number };
        window.dispatchEvent(new CustomEvent("electricityUpdated", { detail }));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save meter reading");
    } finally {
      setSavingMeterId(null);
    }
  };

  const createMeterForRoom = async (room) => {
    try {
      setError("");
      const meterPayload = {
        meter_number: `${room.block_number || selectedBlock}-${room.room_number}`,
        block_number: room.block_number || selectedBlock,
        floor_number: room.floor_number || "",
        room_number: room.room_number,
        rate_per_unit: Number(meterForm.rate_per_unit || 14)
      };
      const res = await API.post(`/electricity-meters`, meterPayload);
      const newMeter = res.data.data;
      // add to meters list and open inline editor so user can set units
      setMeters((prev) => [...prev, newMeter]);
      setEditingMeterId(newMeter.id);
      setMeterForm({
        current_reading: "",
        rate_per_unit: String(newMeter.rate_per_unit || 14),
        reading_date: new Date().toISOString().slice(0, 10)
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create meter for room");
    }
  };

  const getMeterForRoom = (room) => {
    return meters.find((m) => String(m.room_number) === String(room.room_number) && String(m.block_number) === String(room.block_number));
  };

  const deleteMeter = async (meterId) => {
    if (!window.confirm("Are you sure you want to delete this meter? This action cannot be undone.")) {
      return;
    }
    try {
      setError("");
      await API.delete(`/electricity-meters/${meterId}`);
      await fetchMeters(selectedBlock);
      setEditingMeterId(null);
      setMeterForm({ current_reading: "", rate_per_unit: "14" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete meter");
    }
  };

  const resetMeter = async (meterId) => {
    if (!window.confirm("Are you sure you want to reset this meter? All readings will be cleared.")) {
      return;
    }
    try {
      setError("");
      await API.post(`/electricity-meters/${meterId}/reset`);
      await fetchMeters(selectedBlock);
      setEditingMeterId(null);
      setMeterForm({ current_reading: "", rate_per_unit: "14" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset meter");
    }
  };

  return (
    <Layout>
      <div className="electricity-page">
        <div className="electricity-header">
          <h2>⚡ Electricity Billing</h2>
          <p>Upload units, calculate meter charges, and update resident electricity amounts.</p>
        </div>

        <Alert>{error}</Alert>

        <div className="electricity-controls">
          <div className="control-group">
            <label>Block</label>
            <Select value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)}>
              {blocks.map((block) => (
                <option key={block} value={block}>
                  Block {block}
                </option>
              ))}
            </Select>
          </div>
          <div className="control-note">
            Default electricity rate is ₹14 per unit. If a room is fully occupied, the charge will be shared across occupants.
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading electricity meters...</p>
          </div>
        ) : (
          <>
            <div className="rooms-table-wrap">
              <h3>Rooms in Block {selectedBlock}</h3>
              {rooms.length === 0 ? (
                <div className="empty-state">
                  <p>No rooms found for selected block.</p>
                </div>
              ) : (
                <table className="rooms-table">
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Capacity</th>
                      <th>Occupants</th>
                      <th>Meter</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => {
                      const meter = getMeterForRoom(room);
                      const occ = Array.isArray(room.residents_in_room)
                        ? room.residents_in_room.length
                        : Number(room.current_occupancy ?? 0);
                      return (
                        <tr key={`${room.block_number}-${room.room_number}`}>
                          <td>{room.room_number}</td>
                          <td>{room.capacity || room.room_type || "-"}</td>
                          <td>{occ}</td>
                          <td>{meter ? meter.meter_number : "—"}</td>
                          <td>
                            {meter ? (
                              <Button onClick={() => beginEditingMeter(meter)}>Update Meter</Button>
                            ) : (
                              <Button onClick={() => createMeterForRoom(room)}>Create Meter</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="meters-table-wrap">
              {meters.length === 0 ? (
                <div className="empty-state">
                  <p>No meters found for selected block.</p>
                </div>
              ) : (
                <table className="electricity-table">
                  <thead>
                    <tr>
                      <th>Meter</th>
                      <th>Room</th>
                      <th>Current</th>
                      <th>Previous</th>
                      <th>Units</th>
                      <th>Rate/Unit</th>
                      <th>Last Reading</th>
                      <th>Charge</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meters.map((meter) => (
                      <tr key={meter.id}>
                        <td>{meter.meter_number}</td>
                        <td>Block {meter.block_number} / Room {meter.room_number}</td>
                        <td>{meter.current_reading || 0}</td>
                        <td>{meter.previous_reading || 0}</td>
                        <td>{meter.units_consumed || 0}</td>
                        <td>₹{meter.rate_per_unit || 0}</td>
                        <td>{toDateString(meter.last_reading_date)}</td>
                        <td>₹{meter.monthly_charge || 0}</td>
                        <td>{meter.status}</td>
                        <td>
                          {editingMeterId === meter.id ? (
                            <div className="meter-edit-actions">
                              <Input
                                type="number"
                                name="current_reading"
                                value={meterForm.current_reading}
                                onChange={handleMeterChange}
                                placeholder="Current"
                              />
                              <Input
                                type="number"
                                name="rate_per_unit"
                                value={meterForm.rate_per_unit}
                                onChange={handleMeterChange}
                                placeholder="Rate"
                              />
                              <Input
                                type="date"
                                name="reading_date"
                                value={meterForm.reading_date}
                                onChange={handleMeterChange}
                                placeholder="Reading Date"
                              />
                              <div className="help-hint">Reading date sets billing period end; residents charged for days stayed up to this date.</div>
                              <Button
                                type="button"
                                onClick={() => saveMeterReading(meter.id)}
                                disabled={savingMeterId === meter.id}
                              >
                                {savingMeterId === meter.id ? "Saving..." : "Save"}
                              </Button>
                              <Button type="button" variant="secondary" onClick={cancelEditing}>
                                Cancel
                              </Button>
                              <Button type="button" variant="warning" onClick={() => resetMeter(meter.id)}>
                                Reset
                              </Button>
                              <Button type="button" variant="danger" onClick={() => deleteMeter(meter.id)}>
                                Delete
                              </Button>
                            </div>
                          ) : (
                            <div className="meter-actions">
                              <Button type="button" onClick={() => beginEditingMeter(meter)}>
                                Update
                              </Button>
                              <Button type="button" variant="warning" onClick={() => resetMeter(meter.id)}>
                                Reset
                              </Button>
                              <Button type="button" variant="danger" onClick={() => deleteMeter(meter.id)}>
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
