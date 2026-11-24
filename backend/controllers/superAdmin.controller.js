import { Hostel } from "../models/hostel.model.js";
import { User } from "../models/user.model.js";
import { Complaint } from "../models/complaint.model.js";
import { Payment } from "../models/payment.model.js";
import { Room } from "../models/room.model.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

/**
 * Get SuperAdmin Dashboard Statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalHostels = await Hostel.count();
    const activeHostels = await Hostel.count({ where: { status: "ACTIVE" } });
    const pendingHostels = await Hostel.count({ where: { status: "PENDING" } });

    const totalResidents = await User.count({
      where: { role: "USER", status: "ACTIVE" }
    });

    const totalComplaints = await Complaint.count();
    const openComplaints = await Complaint.count({
      where: { status: "OPEN" }
    });

    const totalPayments = await Payment.count();
    const totalBeds = await Room.sum("capacity");

    // Calculate occupancy
    const occupiedRooms = await User.count({
      where: { role: "USER", status: "ACTIVE" }
    });

    const occupancyRate = totalBeds ? Math.round((occupiedRooms / totalBeds) * 100) : 0;

    res.json({
      success: true,
      data: {
        hostels: {
          total: totalHostels,
          active: activeHostels,
          pending: pendingHostels
        },
        residents: {
          total: totalResidents
        },
        complaints: {
          total: totalComplaints,
          open: openComplaints
        },
        payments: {
          total: totalPayments
        },
        facilities: {
          totalBeds: totalBeds || 0,
          occupancy: occupancyRate
        }
      }
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

/**
 * Get All Hostels with Pagination
 */
export const getAllHostels = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Optional filter

    const whereClause = status ? { status } : {};

    const { count, rows } = await Hostel.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [["registration_date", "DESC"]],
      attributes: {
        include: [
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM "Users" WHERE "Users"."hostel_id" = "Hostel"."id" AND "Users"."status" = 'ACTIVE')`
            ),
            "active_residents"
          ]
        ]
      }
    });

    res.json({
      success: true,
      data: {
        hostels: rows,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      }
    });
  } catch (err) {
    console.error("Error fetching hostels:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

/**
 * Get Hostel Details
 */
export const getHostelDetails = async (req, res) => {
  try {
    const { hostelId } = req.params;

    const hostel = await Hostel.findByPk(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        msg: "Hostel not found"
      });
    }

    // Get hostel-specific statistics
    const residents = await User.count({
      where: { hostel_id: hostelId, role: "USER", status: "ACTIVE" }
    });

    const rooms = await Room.count({
      where: { hostel_id: hostelId }
    });

    const complaints = await Complaint.count({
      where: { hostel_id: hostelId }
    });

    const payments = await Payment.findAll({
      where: { hostel_id: hostelId }
    });

    const totalPayment = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        hostel: hostel.toJSON(),
        stats: {
          residents,
          rooms,
          complaints,
          collected_payment: totalPayment
        }
      }
    });
  } catch (err) {
    console.error("Error fetching hostel details:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

  export const registerHostel = async (req, res) => {
    try {
      const {
        hostel_name,
        owner_name,
        owner_phone,
        owner_email,
        address,
        city,
        state,
        subscription_plan
      } = req.body;

      if (!hostel_name || !owner_email) {
        return res.status(400).json({
          success: false,
          msg: "hostel_name and owner_email are required"
        });
      }

      const hostel_code = hostel_name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const existingHostel = await Hostel.findOne({ where: { hostel_code } });
      if (existingHostel) {
        return res.status(400).json({
          success: false,
          msg: "A hostel with this name already exists"
        });
      }

      const hostel = await Hostel.create({
        hostel_name,
        hostel_code,
        owner_name: owner_name || null,
        owner_phone: owner_phone || null,
        owner_email,
        address: address || null,
        city: city || null,
        state: state || null,
        subscription_plan: subscription_plan || "BASIC"
      });

      res.status(201).json({
        success: true,
        msg: "Hostel registered successfully",
        data: hostel
      });
    } catch (err) {
      console.error("Error registering hostel:", err);
      res.status(500).json({ success: false, msg: err.message });
    }
  };

  export const approveHostel = async (req, res) => {
    try {
      const { hostelId } = req.params;
      const hostel = await Hostel.findByPk(hostelId);
      if (!hostel) {
        return res.status(404).json({ success: false, msg: "Hostel not found" });
      }

      await hostel.update({
        status: "ACTIVE",
        approval_date: new Date(),
        approved_by: req.user.id
      });

      res.json({
        success: true,
        msg: "Hostel approved successfully",
        data: hostel
      });
    } catch (err) {
      console.error("Error approving hostel:", err);
      res.status(500).json({ success: false, msg: err.message });
    }
  };

/**
 * Get Hostel Analytics
 */
export const getHostelAnalytics = async (req, res) => {
  try {
    const { hostelId } = req.params;

    const hostel = await Hostel.findByPk(hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        msg: "Hostel not found"
      });
    }

    // Complaint categories
    const complaintAnalytics = await Complaint.findAll({
      where: { hostel_id: hostelId },
      attributes: [
        "category",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["category"]
    });

    // Payment status
    const paymentAnalytics = await Payment.findAll({
      where: { hostel_id: hostelId },
      attributes: [
        "payment_status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"]
      ],
      group: ["payment_status"]
    });

    // Resident status
    const residentStatus = await User.findAll({
      where: { hostel_id: hostelId, role: "USER" },
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["status"]
    });

    res.json({
      success: true,
      data: {
        complaints: complaintAnalytics,
        payments: paymentAnalytics,
        residents: residentStatus
      }
    });
  } catch (err) {
    console.error("Error fetching hostel analytics:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

/**
 * Get Payment Analytics Across All Hostels
 */
export const getPaymentAnalytics = async (req, res) => {
  try {
    // Group by payment status
    const byStatus = await Payment.findAll({
      attributes: [
        "payment_status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("amount")), "total"]
      ],
      group: ["payment_status"]
    });

    // Group by payment method
    const byMethod = await Payment.findAll({
      attributes: [
        "payment_method",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("amount")), "total"]
      ],
      group: ["payment_method"]
    });

    // Group by hostel (top 5)
    const byHostel = await Payment.findAll({
      attributes: [
        "hostel_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("amount")), "total"]
      ],
      group: ["hostel_id"],
      limit: 5,
      order: [[sequelize.fn("SUM", sequelize.col("amount")), "DESC"]],
      include: [
        {
          model: Hostel,
          attributes: ["hostel_name"],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        by_status: byStatus,
        by_method: byMethod,
        by_hostel: byHostel
      }
    });
  } catch (err) {
    console.error("Error fetching payment analytics:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

/**
 * Get Complaint Analytics Across All Hostels
 */
export const getComplaintAnalytics = async (req, res) => {
  try {
    // Group by category
    const byCategory = await Complaint.findAll({
      attributes: [
        "category",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["category"]
    });

    // Group by status
    const byStatus = await Complaint.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["status"]
    });

    // By hostel (top 5)
    const byHostel = await Complaint.findAll({
      attributes: [
        "hostel_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["hostel_id"],
      limit: 5,
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]]
    });

    res.json({
      success: true,
      data: {
        by_category: byCategory,
        by_status: byStatus,
        by_hostel: byHostel
      }
    });
  } catch (err) {
    console.error("Error fetching complaint analytics:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

/**
 * Get Resident Statistics
 */
export const getResidentStats = async (req, res) => {
  try {
    const totalResidents = await User.count({
      where: { role: "USER", status: "ACTIVE" }
    });

    const residentsByHostel = await User.findAll({
      where: { role: "USER" },
      attributes: [
        "hostel_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["hostel_id"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]]
    });

    res.json({
      success: true,
      data: {
        total: totalResidents,
        by_hostel: residentsByHostel
      }
    });
  } catch (err) {
    console.error("Error fetching resident stats:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};
