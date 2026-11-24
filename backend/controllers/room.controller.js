// controllers/room.controller.js
import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { Sequelize } from "sequelize";
import { normalizeAcStatus, normalizeRoomType, calculateRoomRent } from "../utils/roomSync.js";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";
import { successResponse, errorResponse } from "../utils/response.js";

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
    await resident.save().catch(() => {});
  }));
};

// Get all rooms (with resident occupancy)
export const getAllRooms = async (req, res) => {
  try {
    const where = {};
    if (req?.user?.role !== "SUPER_ADMIN") {
      Object.assign(where, getHostelFilter(req.user));
    }
    if (req.query.block_number) {
      where.block_number = req.query.block_number;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }

    const rooms = await Room.findAll({
      where,
      order: [
        ['block_number', 'ASC'],
        ['floor_number', 'ASC'],
        ['room_number', 'ASC']
      ]
    });

    const activeResidents = await User.findAll({
      attributes: ['id', 'name', 'phone', 'email', 'room_type', 'ac_status', 'block_number', 'room_number'],
      where: {
        status: "ACTIVE",
        role: "USER",
        ...(req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
      }
    });

    const roomResidentsMap = new Map();
    activeResidents.forEach((resident) => {
      const key = `${resident.block_number}_${resident.room_number}`;
      if (!roomResidentsMap.has(key)) {
        roomResidentsMap.set(key, []);
      }
      roomResidentsMap.get(key).push(resident);
    });

    const enrichedRooms = rooms.map((room) => {
      const plain = room.get({ plain: true });
      const residents = roomResidentsMap.get(`${plain.block_number}_${plain.room_number}`) || [];
      const currentOccupancy = residents.length;
      return {
        ...plain,
        residents_in_room: residents,
        current_occupancy: currentOccupancy,
        vacancy: Math.max((plain.capacity || 2) - currentOccupancy, 0),
        status: currentOccupancy >= (plain.capacity || 2) ? "OCCUPIED" : plain.status
      };
    });

    return successResponse(res, "Rooms retrieved successfully", enrichedRooms);
  } catch (err) {
    console.error("Error in getAllRooms:", err);
    return errorResponse(res, err?.message || "Failed to load rooms", 500);
  }
};

// Get all blocks with their summary
export const getAllBlocks = async (req, res) => {
  try {
    const blockWhere = {};
    if (req?.user?.role !== "SUPER_ADMIN") {
      Object.assign(blockWhere, getHostelFilter(req.user));
    }

    // 1. Group rooms by block
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

    // 2. Single aggregated query for resident counts by block
    const residentCounts = await User.findAll({
      attributes: [
        'block_number',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'residents_count']
      ],
      where: {
        status: "ACTIVE",
        role: "USER",
        ...(req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
      },
      group: ['block_number'],
      raw: true
    });

    const resCountMap = new Map();
    residentCounts.forEach(r => {
      resCountMap.set(String(r.block_number || "").trim(), parseInt(r.residents_count || 0, 10));
    });

    const blocksData = roomsByBlock.map((block) => {
      const bn = String(block.block_number || "").trim();
      const totalRooms = parseInt(block.total_rooms || 0, 10);
      const occupiedRooms = parseInt(block.occupied_rooms || 0, 10);
      return {
        block_number: bn,
        total_rooms: totalRooms,
        occupied_rooms: occupiedRooms,
        vacant_rooms: Math.max(totalRooms - occupiedRooms, 0),
        residents_count: resCountMap.get(bn) || 0
      };
    });

    return successResponse(res, "Blocks retrieved successfully", blocksData);
  } catch (err) {
    console.error("Error in getAllBlocks:", err);
    return errorResponse(res, err?.message || "Failed to load blocks", 500);
  }
};

// Get rooms by specific block
export const getRoomsByBlock = async (req, res) => {
  try {
    const { blockNumber } = req.params;
    const roomWhere = { block_number: blockNumber };
    if (req?.user?.role !== "SUPER_ADMIN") {
      Object.assign(roomWhere, getHostelFilter(req.user));
    }

    const rooms = await Room.findAll({
      where: roomWhere,
      order: [['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    // Single batch query for all active residents in this block
    const residents = await User.findAll({
      where: {
        block_number: blockNumber,
        status: "ACTIVE",
        role: "USER",
        ...(req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
      },
      attributes: ['id', 'name', 'phone', 'email', 'room_type', 'ac_status', 'room_number']
    });

    const residentsByRoom = new Map();
    residents.forEach(res => {
      const rn = String(res.room_number || "").trim();
      if (!residentsByRoom.has(rn)) {
        residentsByRoom.set(rn, []);
      }
      residentsByRoom.get(rn).push(res);
    });

    const roomsWithResidents = rooms.map((room) => {
      const rn = String(room.room_number || "").trim();
      const inRoom = residentsByRoom.get(rn) || [];
      return {
        ...room.toJSON(),
        residents_in_room: inRoom,
        current_occupancy: inRoom.length
      };
    });

    return res.status(200).json({
      success: true,
      block_number: blockNumber,
      data: roomsWithResidents
    });
  } catch (err) {
    console.error("Error in getRoomsByBlock:", err);
    return errorResponse(res, err?.message || "Failed to load rooms for block", 500);
  }
};

// Get specific room details with residents
export const getRoomDetails = async (req, res) => {
  try {
    const { blockNumber, roomNumber } = req.params;

    const roomWhere = {
      block_number: blockNumber,
      room_number: roomNumber
    };
    if (req?.user?.role !== "SUPER_ADMIN") {
      Object.assign(roomWhere, getHostelFilter(req.user));
    }
    const room = await Room.findOne({
      where: roomWhere
    });

    if (!room) {
      return errorResponse(res, "Room not found", 404);
    }

    const residents = await User.findAll({
      where: {
        block_number: blockNumber,
        room_number: roomNumber,
        status: "ACTIVE",
        ...(req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {})
      },
      attributes: ['id', 'name', 'phone', 'email', 'join_date', 'rent_amount', 'electricity_charges', 'total_charges']
    });

    return successResponse(res, "Room details retrieved", {
      ...room.toJSON(),
      residents,
      occupancy: residents.length,
      capacity: room.capacity
    });
  } catch (err) {
    return errorResponse(res, err?.message || "Failed to load room details", 500);
  }
};

// Create new room
export const createRoom = async (req, res) => {
  try {
    const roomType = normalizeRoomType(req?.body?.room_type);
    const acStatus = normalizeAcStatus(req?.body?.ac_status);
    const block_number = sanitizeText(req?.body?.block_number);
    const floor_number = sanitizeText(req?.body?.floor_number);
    const room_number = sanitizeText(req?.body?.room_number);

    if (!block_number || !floor_number || !room_number) {
      return errorResponse(res, "Block number, floor number and room number are required", 400);
    }

    const existingRoom = await Room.findOne({
      where: { block_number, room_number, ...(req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {}) }
    });

    if (existingRoom) {
      return errorResponse(res, "Room already exists in this block", 400);
    }

    const isPremium = Boolean(req?.body?.is_premium);
    const suggestedRent = calculateRoomRent(roomType, acStatus, isPremium);
    const roomBaseRent = suggestedRent || sanitizeMoney(req?.body?.base_rent);

    const room = await Room.create({
      block_number,
      floor_number,
      room_number,
      room_type: roomType,
      is_premium: isPremium,
      ac_status: acStatus,
      capacity: deriveCapacity(roomType, req?.body?.capacity),
      base_rent: roomBaseRent,
      electricity_meter_number: sanitizeText(req?.body?.electricity_meter_number) || `M-${block_number}-${room_number}`,
      status: "AVAILABLE",
      hostel_id: req?.user?.hostel_id || null
    });

    await updateActiveRoomOccupantRent(block_number, room_number, roomBaseRent);

    return successResponse(res, "Room created successfully", room, 201);
  } catch (err) {
    return errorResponse(res, err?.message || "Failed to create room", 500);
  }
};

// Update existing room
export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findByPk(roomId);

    if (!room) {
      return errorResponse(res, "Room not found", 404);
    }

    const roomType = normalizeRoomType(req?.body?.room_type ?? room.room_type);
    const acStatus = normalizeAcStatus(req?.body?.ac_status ?? room.ac_status);
    const block_number = sanitizeText(req?.body?.block_number ?? room.block_number);
    const floor_number = sanitizeText(req?.body?.floor_number ?? room.floor_number);
    const room_number = sanitizeText(req?.body?.room_number ?? room.room_number);

    if (!block_number || !floor_number || !room_number) {
      return errorResponse(res, "Block number, floor number and room number are required", 400);
    }

    const duplicateRoom = await Room.findOne({
      where: { block_number, room_number, ...(req?.user?.role !== "SUPER_ADMIN" ? getHostelFilter(req.user) : {}) }
    });
    if (duplicateRoom && duplicateRoom.id !== room.id) {
      return errorResponse(res, "Another room already exists with this block and room number", 400);
    }

    if (req?.user?.role !== "SUPER_ADMIN" && room.hostel_id && req?.user?.hostel_id !== room.hostel_id) {
      return errorResponse(res, "Access denied", 403);
    }

    const isPremium = Boolean(req?.body?.is_premium ?? room.is_premium);
    const suggestedRent = calculateRoomRent(roomType, acStatus, isPremium);
    const roomBaseRent = suggestedRent || sanitizeMoney(req?.body?.base_rent ?? room.base_rent);

    await room.update({
      block_number,
      floor_number,
      room_number,
      room_type: roomType,
      is_premium: isPremium,
      ac_status: acStatus,
      capacity: deriveCapacity(roomType, req?.body?.capacity ?? room.capacity),
      base_rent: roomBaseRent,
      electricity_meter_number: sanitizeText(
        req?.body?.electricity_meter_number ?? room.electricity_meter_number
      ),
      hostel_id: req?.user?.hostel_id || room.hostel_id || null
    });

    await updateActiveRoomOccupantRent(block_number, room_number, roomBaseRent);

    return successResponse(res, "Room updated successfully", room);
  } catch (err) {
    return errorResponse(res, err?.message || "Failed to update room", 500);
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findByPk(roomId);

    if (!room) {
      return errorResponse(res, "Room not found", 404);
    }

    const residentsCount = await User.count({
      where: {
        block_number: room.block_number,
        room_number: room.room_number,
        status: "ACTIVE"
      }
    });

    if (req?.user?.role !== "SUPER_ADMIN" && room.hostel_id && req?.user?.hostel_id !== room.hostel_id) {
      return errorResponse(res, "Access denied", 403);
    }

    if (residentsCount > 0) {
      return errorResponse(res, "Cannot delete room with active residents", 400);
    }

    await room.destroy();

    return successResponse(res, "Room deleted successfully");
  } catch (err) {
    return errorResponse(res, err?.message || "Failed to delete room", 500);
  }
};
