// controllers/dashboardController.js
import { User } from "../models/user.model.js";
import { Room } from "../models/room.model.js";
import { Payment } from "../models/payment.model.js";
import { Sequelize } from "sequelize";
import { syncRoomsFromActiveResidents } from "../utils/roomSync.js";

export const getDashboardStats = async (req, res) => {
  try {
    await syncRoomsFromActiveResidents();

    // Get total active residents
    const totalResidents = await User.count({
      where: { status: "ACTIVE" }
    });

    // Get residents grouped by block
    const blockGroups = await User.findAll({
      attributes: [
        'block_number',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { status: "ACTIVE" },
      group: ['block_number'],
      raw: true,
      order: [['block_number', 'ASC']]
    });

    const rooms = await Room.findAll({
      order: [['block_number', 'ASC'], ['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    const totalRooms = await Room.count();
    const occupiedRooms = await Room.count({
      where: { status: "OCCUPIED" }
    });

    const roomStats = await Promise.all(
      rooms.map(async (room) => {
        const occupied = await User.count({
          where: {
            block_number: room.block_number,
            room_number: room.room_number,
            status: "ACTIVE"
          }
        });

        return {
          id: room.id,
          block_number: room.block_number,
          room_number: room.room_number,
          occupied,
          capacity: room.capacity,
          vacancy: Math.max((room.capacity || 0) - occupied, 0),
          status: room.status
        };
      })
    );

    // Get payment statistics
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const unpaidPayments = await Payment.count({
      where: {
        payment_status: ["PENDING", "OVERDUE"],
        month: currentMonth
      }
    });

    // Calculate occupancy data
    const occupancyData = blockGroups.map(block => ({
      block: block.block_number || "Not Assigned",
      residents: parseInt(block.count || 0)
    }));

    res.status(200).json({
      success: true,
      data: {
        totalResidents,
        blockGroups: occupancyData,
        roomOccupancy: roomStats,
        roomStats: {
          totalRooms,
          occupiedRooms,
          vacantRooms: totalRooms - occupiedRooms
        },
        payments: {
          unpaidCount: unpaidPayments,
          currentMonth
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get summary by block
export const getBlockSummary = async (req, res) => {
  try {
    const { blockNumber } = req.params;
    await syncRoomsFromActiveResidents();

    const residents = await User.count({
      where: { block_number: blockNumber, status: "ACTIVE" }
    });

    const rooms = await Room.count({
      where: { block_number: blockNumber }
    });

    const occupiedRooms = await Room.count({
      where: { block_number: blockNumber, status: "OCCUPIED" }
    });

    const roomDetails = await Room.findAll({
      where: { block_number: blockNumber },
      order: [['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        block_number: blockNumber,
        total_residents: residents,
        total_rooms: rooms,
        occupied_rooms: occupiedRooms,
        vacant_rooms: rooms - occupiedRooms,
        rooms: roomDetails
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get room occupancy summary
export const getRoomOccupancySummary = async (req, res) => {
  try {
    await syncRoomsFromActiveResidents();

    const rooms = await Room.findAll({
      order: [['block_number', 'ASC'], ['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    const summary = await Promise.all(
      rooms.map(async (room) => {
        const occupants = await User.count({
          where: {
            block_number: room.block_number,
            room_number: room.room_number,
            status: "ACTIVE"
          }
        });
        return {
          ...room.toJSON(),
          occupants,
          vacancy: room.capacity - occupants
        };
      })
    );

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

