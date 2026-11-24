// Controllers/paymentController.js
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { Sequelize } from "sequelize";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";

// Get payment history for a resident
export const getResidentPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (req.user.role !== "SUPER_ADMIN" && req.user.hostel_id && user.hostel_id !== req.user.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const paymentWhere = { user_id: userId };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(paymentWhere, getHostelFilter(req.user));
    }
    const payments = await Payment.findAll({
      where: paymentWhere,
      order: [['month', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          block: user.block_number,
          room: user.room_number,
          rent_amount: user.rent_amount,
          electricity_charges: user.electricity_charges
        },
        payments: payments
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get current month payment status for all residents
export const getCurrentMonthPaymentStatus = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const userWhere = { status: "ACTIVE" };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(userWhere, getHostelFilter(req.user));
    }
    const residents = await User.findAll({
      where: userWhere,
      attributes: ['id', 'name', 'block_number', 'room_number', 'phone', 'rent_amount', 'electricity_charges', 'total_charges'],
      raw: true
    });

    const paymentStatus = await Promise.all(
      residents.map(async (resident) => {
        const payment = await Payment.findOne({
          where: {
            user_id: resident.id,
            month: currentMonth
          }
        });

        const status = payment?.payment_status || "PENDING";
        const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 10);
        const isOverdue = new Date() > dueDate && status === "PENDING";

        return {
          ...resident,
          payment_status: isOverdue ? "OVERDUE" : status,
          payment_amount: resident.total_charges,
          due_date: dueDate,
          paid_date: payment?.paid_date || null
        };
      })
    );

    res.status(200).json({
      success: true,
      month: currentMonth,
      data: paymentStatus
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Record a payment
export const recordPayment = async (req, res) => {
  try {
    const { user_id, amount, month, payment_method, receipt_number, notes } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const payment = await Payment.create({
      user_id,
      amount,
      month,
      rent_amount: user.rent_amount,
      electricity_amount: user.electricity_charges,
      payment_status: "PAID",
      payment_method,
      receipt_number,
      notes,
      paid_date: new Date()
      ,hostel_id: user.hostel_id || null
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get overdue payments
export const getOverduePayments = async (req, res) => {
  try {
    const currentDate = new Date();
    const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 10);

    const payWhere = {
      payment_status: "PENDING",
      paid_date: null
    };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(payWhere, getHostelFilter(req.user));
    }
    const payments = await Payment.findAll({
      where: {
        ...payWhere
      },
      include: [{
        model: User,
        attributes: ['name', 'phone', 'block_number', 'room_number']
      }],
      order: [['createdAt', 'ASC']]
    });

    const overdueList = payments.filter(p => p.createdAt < dueDate);

    res.status(200).json({
      success: true,
      data: overdueList
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get payment summary by month
export const getMonthlyPaymentSummary = async (req, res) => {
  try {
    const paymentWhere = {};
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(paymentWhere, getHostelFilter(req.user));
    }
    const summary = await Payment.findAll({
      attributes: [
        'month',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_payments'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_amount'],
        [Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN payment_status = 'PAID' THEN 1 END`)), 'paid_count'],
        [Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN payment_status = 'PENDING' THEN 1 END`)), 'pending_count']
      ],
      where: paymentWhere,
      group: ['month'],
      order: [['month', 'DESC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { payment_status } = req.body;

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (req.user.role !== "SUPER_ADMIN" && payment.hostel_id && req.user.hostel_id !== payment.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    payment.payment_status = payment_status;
    if (payment_status === "PAID" && !payment.paid_date) {
      payment.paid_date = new Date();
    }
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
