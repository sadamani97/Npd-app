// controllers/complaint.controller.js
import { Complaint } from "../models/complaint.model.js";
import { User } from "../models/user.model.js";

export const addComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user.id;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      userId
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
    
    // If admin, get all complaints; otherwise get user's complaints
    let complaints;
    if (req.user.role === "ADMIN") {
      complaints = await Complaint.findAll({
        include: [{ model: User, attributes: ["id", "name", "phone", "email"] }],
        order: [["createdAt", "DESC"]]
      });
    } else {
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

    await complaint.destroy();
    res.json({ success: true, message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
