// Controllers/roomController.js
import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { Sequelize } from "sequelize";
import { normalizeAcStatus, normalizeRoomType, syncRoomsFromActiveResidents, calculateRoomRent } from "../utils/roomSync.js";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";

const ROOM_TYPE_CAPACITY = {
  SINGLE_SHARE: 1,
  DOUBLE_SHARE: 2,
  TRIPLE_SHARE: 3,
  FOUR_SHARE: 4,
  FIVE_SHARE: 5,
  SIX_SHARE: 6
};

const sanitizeText = (value) => String(value ?? "").trim();
const sanitizeMoney = (value) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};
const deriveCapacity = (roomType, providedCapacity) => {
  const parsed = Number.parseInt(providedCapacity, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return ROOM_TYPE_CAPACITY[roomType] || 2;
};

const updateActiveRoomOccupantRent = async (blockNumber, roomNumber, rentAmount) => {
  if (rentAmount == null) return;
  const activeResidents = await User.findAll({
    where: {
      block_number: blockNumber,
      room_number: roomNumber,
      status: "ACTIVE"
    }
  });
  await Promise.all(activeResidents.map(async (resident) => {
    resident.rent_amount = rentAmount;
    resident.total_charges = parseFloat((parseFloat(rentAmount || 0) + parseFloat(resident.electricity_charges || 0)).toFixed(2));
    await resident.save();
  }));
};

// Get all blocks with their details
export const getAllBlocks = async (req, res) => {
  try {
    await syncRoomsFromActiveResidents();

    const blockWhere = {};
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(blockWhere, getHostelFilter(req.user));
    }
    const roomsByBlock = await Room.findAll({
      attributes: [
        'block_number',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_rooms'],
        [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END`)), 'occupied_rooms']
      ],
      where: blockWhere,
      group: ['block_number'],
      raw: true,
      order: [['block_number', 'ASC']]
    });

    const blocksData = await Promise.all(
      roomsByBlock.map(async (block) => {
        const residents = await User.count({
            where: {
              block_number: block.block_number,
              status: "ACTIVE",
              ...(req.user.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
            }
        });
        return {
          block_number: block.block_number,
          total_rooms: parseInt(block.total_rooms || 0),
          occupied_rooms: parseInt(block.occupied_rooms || 0),
          vacant_rooms: parseInt(block.total_rooms || 0) - parseInt(block.occupied_rooms || 0),
          residents_count: residents
        };
      })
    );

    res.status(200).json({
      success: true,
      data: blocksData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get rooms by specific block
export const getRoomsByBlock = async (req, res) => {
  try {
    const { blockNumber } = req.params;
    await syncRoomsFromActiveResidents();
    const roomWhere = { block_number: blockNumber };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(roomWhere, getHostelFilter(req.user));
    }
    const rooms = await Room.findAll({
      where: roomWhere,
      order: [['floor_number', 'ASC'], ['room_number', 'ASC']],
      raw: false
    });

    // Get resident info for each room
    const roomsWithResidents = await Promise.all(
      rooms.map(async (room) => {
        const residents = await User.findAll({
          where: {
            block_number: blockNumber,
            room_number: room.room_number,
            status: "ACTIVE"
            ,...(req.user.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
          },
          attributes: ['id', 'name', 'phone', 'email', 'room_type', 'ac_status']
        });

        return {
          ...room.toJSON(),
          residents_in_room: residents,
          current_occupancy: residents.length
        };
      })
    );

    res.status(200).json({
      success: true,
      block_number: blockNumber,
      data: roomsWithResidents
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get specific room details with residents
export const getRoomDetails = async (req, res) => {
  try {
    const { blockNumber, roomNumber } = req.params;
    await syncRoomsFromActiveResidents();

    const roomWhere = {
      block_number: blockNumber,
      room_number: roomNumber
    };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(roomWhere, getHostelFilter(req.user));
    }
    const room = await Room.findOne({
      where: roomWhere
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const residents = await User.findAll({
      where: {
        block_number: blockNumber,
        room_number: roomNumber,
        status: "ACTIVE"
        ,...(req.user.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
      },
      attributes: ['id', 'name', 'phone', 'email', 'join_date', 'rent_amount', 'electricity_charges', 'total_charges']
    });

    res.status(200).json({
      success: true,
      data: {
        ...room.toJSON(),
        residents: residents,
        occupancy: residents.length,
        capacity: room.capacity
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create new room
export const createRoom = async (req, res) => {
  try {
    const roomType = normalizeRoomType(req.body.room_type);
    const acStatus = normalizeAcStatus(req.body.ac_status);
    const block_number = sanitizeText(req.body.block_number);
    const floor_number = sanitizeText(req.body.floor_number);
    const room_number = sanitizeText(req.body.room_number);

    if (!block_number || !floor_number || !room_number) {
      return res.status(400).json({
        success: false,
        message: "Block number, floor number and room number are required"
      });
    }

    const existingRoom = await Room.findOne({
      where: { block_number, room_number, ...(req.user.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {}) }
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room already exists in this block"
      });
    }

    const isPremium = Boolean(req.body.is_premium);
    const suggestedRent = calculateRoomRent(roomType, acStatus, isPremium);
    const roomBaseRent = suggestedRent || sanitizeMoney(req.body.base_rent);

    const room = await Room.create({
      block_number,
      floor_number,
      room_number,
      room_type: roomType,
      is_premium: isPremium,
      ac_status: acStatus,
      capacity: deriveCapacity(roomType, req.body.capacity),
      base_rent: roomBaseRent,
      electricity_meter_number: sanitizeText(req.body.electricity_meter_number),
      status: "AVAILABLE",
      hostel_id: req.user.hostel_id || null
    });

    await updateActiveRoomOccupantRent(block_number, room_number, roomBaseRent);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update existing room
export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const roomType = normalizeRoomType(req.body.room_type ?? room.room_type);
    const acStatus = normalizeAcStatus(req.body.ac_status ?? room.ac_status);
    const block_number = sanitizeText(req.body.block_number ?? room.block_number);
    const floor_number = sanitizeText(req.body.floor_number ?? room.floor_number);
    const room_number = sanitizeText(req.body.room_number ?? room.room_number);

    if (!block_number || !floor_number || !room_number) {
      return res.status(400).json({
        success: false,
        message: "Block number, floor number and room number are required"
      });
    }

    const duplicateRoom = await Room.findOne({
      where: { block_number, room_number, ...(req.user.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {}) }
    });
    if (duplicateRoom && duplicateRoom.id !== room.id) {
      return res.status(400).json({
        success: false,
        message: "Another room already exists with this block and room number"
      });
    }

    if (req.user.role !== "SUPER_ADMIN" && room.hostel_id && req.user.hostel_id !== room.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const isPremium = Boolean(req.body.is_premium ?? room.is_premium);
    const suggestedRent = calculateRoomRent(roomType, acStatus, isPremium);
    const roomBaseRent = suggestedRent || sanitizeMoney(req.body.base_rent ?? room.base_rent);

    await room.update({
      block_number,
      floor_number,
      room_number,
      room_type: roomType,
      is_premium: isPremium,
      ac_status: acStatus,
      capacity: deriveCapacity(roomType, req.body.capacity ?? room.capacity),
      base_rent: roomBaseRent,
      electricity_meter_number: sanitizeText(
        req.body.electricity_meter_number ?? room.electricity_meter_number
      ),
      hostel_id: req.user.hostel_id || room.hostel_id || null
    });

    await updateActiveRoomOccupantRent(block_number, room_number, roomBaseRent);

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const residentsCount = await User.count({
      where: {
        block_number: room.block_number,
        room_number: room.room_number,
        status: "ACTIVE"
      }
    });

    if (req.user.role !== "SUPER_ADMIN" && room.hostel_id && req.user.hostel_id !== room.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (residentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete room with active residents"
      });
    }

    await room.destroy();

    res.status(200).json({
      success: true,
      message: "Room deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

