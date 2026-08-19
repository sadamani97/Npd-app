// controllers/dashboardController.js
import { User } from "../models/user.model.js";
import { Room } from "../models/room.model.js";
import { Payment } from "../models/payment.model.js";
import { Sequelize } from "sequelize";
import { syncRoomsFromActiveResidents } from "../utils/roomSync.js";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";

export const getDashboardStats = async (req, res) => {
  try {
    await syncRoomsFromActiveResidents();

    // Get total active residents
    const totalResidents = await User.count({
      where: { 
        status: "ACTIVE",
        role: "USER",
        block_number: ["1", "2"]
      }
    });

    // Get residents grouped by block
    const blockGroups = await User.findAll({
      attributes: [
        'block_number',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { 
        status: "ACTIVE",
        role: "USER",
        block_number: ["1", "2"]
      },
      group: ['block_number'],
      raw: true,
      order: [['block_number', 'ASC']]
    });

    const rooms = await Room.findAll({
      where: { block_number: ["1", "2"] },
      order: [['block_number', 'ASC'], ['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    const totalRooms = await Room.count({
      where: { block_number: ["1", "2"] }
    });
    const occupiedRooms = await Room.count({
      where: { 
        status: "OCCUPIED",
        block_number: ["1", "2"]
      }
    });

    const roomStats = await Promise.all(
      rooms.map(async (room) => {
        const occupied = await User.count({
          where: {
            block_number: room.block_number,
            room_number: room.room_number,
            status: "ACTIVE",
            role: "USER"
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

    // Calculate occupancy data for exactly Block 1 and Block 2
    const occupancyData = ["1", "2"].map(blockNum => {
      const found = blockGroups.find(bg => String(bg.block_number || "").trim() === blockNum);
      return {
        block: blockNum,
        residents: found ? parseInt(found.count || 0) : 0
      };
    });

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

    // Construct block filter with hostel isolation
    const blockFilter = { block_number: blockNumber };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(blockFilter, getHostelFilter(req.user));
    }

    // Check if there are any rooms configured in this block
    const roomsCount = await Room.count({
      where: blockFilter
    });

    if (roomsCount === 0) {
      return res.status(404).json({
        success: false,
        message: `Block ${blockNumber} not found`
      });
    }

    const residents = await User.count({
      where: {
        block_number: blockNumber,
        status: "ACTIVE",
        role: "USER",
        ...(req.user.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
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

    res.status(200).json({
      success: true,
      data: {
        block_number: blockNumber,
        total_residents: residents,
        total_rooms: roomsCount,
        occupied_rooms: occupiedRooms,
        vacant_rooms: roomsCount - occupiedRooms,
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

    const roomWhere = {};
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(roomWhere, getHostelFilter(req.user));
    } else {
      roomWhere.block_number = ["1", "2"];
    }

    const rooms = await Room.findAll({
      where: roomWhere,
      order: [['block_number', 'ASC'], ['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    const summary = await Promise.all(
      rooms.map(async (room) => {
        const occupants = await User.count({
          where: {
            block_number: room.block_number,
            room_number: room.room_number,
            status: "ACTIVE",
            role: "USER"
          }
        });
        return {
          ...room.toJSON(),
          occupants,
          vacancy: Math.max((room.capacity || 0) - occupants, 0)
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

// Get individual room occupancy
export const getIndividualRoomOccupancy = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    await syncRoomsFromActiveResidents();

    const roomWhere = { room_number: roomNumber };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(roomWhere, getHostelFilter(req.user));
    }

    const rooms = await Room.findAll({
      where: roomWhere,
      order: [['block_number', 'ASC']]
    });

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Room ${roomNumber} not found`
      });
    }

    const summary = await Promise.all(
      rooms.map(async (room) => {
        const occupants = await User.count({
          where: {
            block_number: room.block_number,
            room_number: room.room_number,
            status: "ACTIVE",
            role: "USER"
          }
        });

        const residents = await User.findAll({
          where: {
            block_number: room.block_number,
            room_number: room.room_number,
            status: "ACTIVE",
            role: "USER"
          },
          attributes: ['id', 'name', 'phone', 'email']
        });

        return {
          ...room.toJSON(),
          occupants,
          vacancy: Math.max((room.capacity || 0) - occupants, 0),
          residents_details: residents
        };
      })
    );

    res.status(200).json({
      success: true,
      data: summary.length === 1 ? summary[0] : summary
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

