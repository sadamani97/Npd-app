// controllers/complaint.controller.js
import { Complaint, User } from "../models/index.js";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";

export const addComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user.id;
    const hostel_id = req.user.hostel_id; // Add hostel_id from the authenticated user

    if (!hostel_id && req.user.role !== "SUPER_ADMIN") {
        return res.status(400).json({ success: false, message: "User is not associated with a hostel" });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      userId,
      hostel_id
    });

    res.status(201).json({ 
      success: true, 
      message: "Complaint registered successfully", 
      data: complaint 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const hostelId = req.user.hostel_id;
    
    let complaints;
    
    if (userRole === "SUPER_ADMIN") {
      // Super admin sees everything
      complaints = await Complaint.findAll({
        include: [{ model: User, as: "user", attributes: ["id", "name", "phone", "email"] }],
        order: [["createdAt", "DESC"]]
      });
    } else if (userRole === "ADMIN" || userRole === "HOSTEL_ADMIN") {
      // Hostel Admin sees all complaints for their hostel
      complaints = await Complaint.findAll({
        where: { ...getHostelFilter(req.user) },
        include: [{ model: User, as: "user", attributes: ["id", "name", "phone", "email"] }],
        order: [["createdAt", "DESC"]]
      });
    } else {
      // Regular user sees only their own complaints
      complaints = await Complaint.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]]
      });
    }

    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (req.user.role !== "SUPER_ADMIN" && complaint.hostel_id && req.user.hostel_id !== complaint.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await complaint.update({ status });
    res.json({ success: true, message: "Complaint updated", data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByPk(id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (req.user.role !== "SUPER_ADMIN" && complaint.hostel_id && req.user.hostel_id !== complaint.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await complaint.destroy();
    res.json({ success: true, message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
