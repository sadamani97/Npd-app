// controllers/dashboardController.js
import { User } from "../models/user.model.js";
import { Room } from "../models/room.model.js";
import { Payment } from "../models/payment.model.js";
import { Sequelize, Op } from "sequelize";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getDashboardStats = async (req, res) => {
  try {
    const hostelFilter = req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {};

    // 1. Total active residents
    const totalResidents = await User.count({
      where: { 
        status: "ACTIVE",
        role: "USER",
        ...hostelFilter
      }
    });

    // 2. Residents grouped by block (1 fast group-by query)
    const blockGroups = await User.findAll({
      attributes: [
        'block_number',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { 
        status: "ACTIVE",
        role: "USER",
        ...hostelFilter,
        block_number: { [Op.ne]: null }
      },
      group: ['block_number'],
      raw: true,
      order: [['block_number', 'ASC']]
    });

    // 3. Room Occupants via single aggregated query (eliminates N+1 DB queries)
    const occupantCounts = await User.findAll({
      attributes: [
        'block_number',
        'room_number',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'occupied']
      ],
      where: {
        status: "ACTIVE",
        role: "USER",
        ...hostelFilter,
        block_number: { [Op.ne]: null },
        room_number: { [Op.ne]: null }
      },
      group: ['block_number', 'room_number'],
      raw: true
    });

    const occupancyMap = new Map();
    occupantCounts.forEach(o => {
      const key = `${String(o.block_number || "").trim()}_${String(o.room_number || "").trim()}`;
      occupancyMap.set(key, parseInt(o.occupied || 0, 10));
    });

    // 4. Rooms list
    const rooms = await Room.findAll({
      where: { ...hostelFilter },
      order: [['block_number', 'ASC'], ['floor_number', 'ASC'], ['room_number', 'ASC']],
      raw: true
    });

    const totalRooms = rooms.length;
    let occupiedRoomsCount = 0;

    const roomStats = rooms.map((room) => {
      const key = `${String(room.block_number || "").trim()}_${String(room.room_number || "").trim()}`;
      const occupied = occupancyMap.get(key) || 0;
      if (occupied > 0 || room.status === "OCCUPIED") {
        occupiedRoomsCount++;
      }
      const capacity = parseInt(room.capacity || 2, 10);
      return {
        id: room.id,
        block_number: room.block_number,
        floor_number: room.floor_number,
        room_number: room.room_number,
        occupied,
        capacity,
        vacancy: Math.max(capacity - occupied, 0),
        status: occupied >= capacity ? "OCCUPIED" : room.status || "AVAILABLE"
      };
    });

    // 5. Payment statistics for current month
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const unpaidPayments = await Payment.count({
      where: {
        payment_status: ["PENDING", "OVERDUE"],
        month: currentMonth,
        ...hostelFilter
      }
    });

    // 6. Block summary data
    const occupancyData = blockGroups.map(bg => ({
      block: String(bg.block_number || "").trim(),
      residents: parseInt(bg.count || 0, 10)
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalResidents,
        blockGroups: occupancyData.length > 0 ? occupancyData : [{ block: "1", residents: 0 }, { block: "2", residents: 0 }],
        roomOccupancy: roomStats,
        roomStats: {
          totalRooms,
          occupiedRooms: occupiedRoomsCount,
          vacantRooms: Math.max(totalRooms - occupiedRoomsCount, 0)
        },
        payments: {
          unpaidCount: unpaidPayments,
          currentMonth
        }
      }
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return errorResponse(res, err?.message || "Failed to fetch dashboard stats", 500);
  }
};

// Get summary by block
export const getBlockSummary = async (req, res) => {
  try {
    const { blockNumber } = req.params;
    const hostelFilter = req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {};
    const blockFilter = { block_number: blockNumber, ...hostelFilter };

    const roomsCount = await Room.count({ where: blockFilter });

    const residents = await User.count({
      where: {
        block_number: blockNumber,
        status: "ACTIVE",
        role: "USER",
        ...hostelFilter
      }
    });

    const occupiedRooms = await Room.count({
      where: {
        ...blockFilter,
        status: "OCCUPIED"
      }
    });

    const roomDetails = await Room.findAll({
      where: blockFilter,
      order: [['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    return successResponse(res, "Block summary retrieved", {
      block_number: blockNumber,
      total_residents: residents,
      total_rooms: roomsCount,
      occupied_rooms: occupiedRooms,
      vacant_rooms: Math.max(roomsCount - occupiedRooms, 0),
      rooms: roomDetails
    });
  } catch (err) {
    return errorResponse(res, err?.message || "Failed to fetch block summary", 500);
  }
};

// Get room occupancy summary
export const getRoomOccupancySummary = async (req, res) => {
  try {
    const hostelFilter = req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {};

    const rooms = await Room.findAll({
      where: { ...hostelFilter },
      order: [['block_number', 'ASC'], ['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    // Single aggregated query for occupants
    const occupantCounts = await User.findAll({
      attributes: [
        'block_number',
        'room_number',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'occupied']
      ],
      where: {
        status: "ACTIVE",
        role: "USER",
        ...hostelFilter
      },
      group: ['block_number', 'room_number'],
      raw: true
    });

    const occupancyMap = new Map();
    occupantCounts.forEach(o => {
      const key = `${String(o.block_number || "").trim()}_${String(o.room_number || "").trim()}`;
      occupancyMap.set(key, parseInt(o.occupied || 0, 10));
    });

    const summary = rooms.map((room) => {
      const key = `${String(room.block_number || "").trim()}_${String(room.room_number || "").trim()}`;
      const occupants = occupancyMap.get(key) || 0;
      const capacity = parseInt(room.capacity || 2, 10);
      return {
        ...room.toJSON(),
        occupants,
        vacancy: Math.max(capacity - occupants, 0)
      };
    });

    return successResponse(res, "Room occupancy summary retrieved", summary);
  } catch (err) {
    return errorResponse(res, err?.message || "Failed to fetch room occupancy", 500);
  }
};

// Get individual room occupancy
export const getIndividualRoomOccupancy = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const hostelFilter = req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {};
    const roomWhere = { room_number: roomNumber, ...hostelFilter };

    const rooms = await Room.findAll({
      where: roomWhere,
      order: [['block_number', 'ASC']]
    });

    if (rooms.length === 0) {
      return errorResponse(res, `Room ${roomNumber} not found`, 404);
    }

    const summary = await Promise.all(
      rooms.map(async (room) => {
        const residents = await User.findAll({
          where: {
            block_number: room.block_number,
            room_number: room.room_number,
            status: "ACTIVE",
            role: "USER",
            ...hostelFilter
          },
          attributes: ['id', 'name', 'phone', 'email']
        });

        const occupants = residents.length;
        const capacity = parseInt(room.capacity || 2, 10);

        return {
          ...room.toJSON(),
          occupants,
          vacancy: Math.max(capacity - occupants, 0),
          residents_details: residents
        };
      })
    );

    return successResponse(
      res,
      "Room details retrieved",
      summary.length === 1 ? summary[0] : summary
    );
  } catch (err) {
    return errorResponse(res, err?.message || "Failed to fetch room details", 500);
  }
};
