import { User } from "../models/user.model.js";
import { VacatedUser } from "../models/vacateduser.model.js";
import { Room } from "../models/room.model.js";
import {
  refreshRoomStatus,
  normalizeRoomType,
  normalizeAcStatus,
  getRoomAssignmentCapacity,
  countActiveResidentsInRoom,
  inferFloorNumber
} from "../utils/roomSync.js";
import bcrypt from "bcryptjs";

const validateRoomDetailsMatch = async (blockNumber, roomNumber, roomType, acStatus) => {
  if (!blockNumber || !roomNumber) return null;

  const room = await Room.findOne({
    where: {
      block_number: blockNumber,
      room_number: roomNumber
    }
  });

  if (!room) {
    return "Enter correct sharing type or room type";
  }

  const roomTypeMismatch = normalizeRoomType(room.room_type) !== normalizeRoomType(roomType);
  const acMismatch = normalizeAcStatus(room.ac_status) !== normalizeAcStatus(acStatus);

  if (roomTypeMismatch || acMismatch) {
    return "Enter correct sharing type or room type";
  }

  return null;
};

export const addUser = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      name,
      phone,
      email,
      password,
      block_number,
      room_number,
      room_type,
      ac_status,
      ...otherData
    } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const normalizedBlock = String(block_number || "").trim();
    const normalizedRoom = String(room_number || "").trim();
    const normalizedRoomType = normalizeRoomType(room_type);
    const normalizedAcStatus = normalizeAcStatus(ac_status);

    if (normalizedBlock && normalizedRoom) {
      const roomMismatchError = await validateRoomDetailsMatch(
        normalizedBlock,
        normalizedRoom,
        normalizedRoomType,
        normalizedAcStatus
      );
      if (roomMismatchError) {
        return res.status(400).json({
          success: false,
          message: roomMismatchError
        });
      }

      const capacity = await getRoomAssignmentCapacity(
        normalizedBlock,
        normalizedRoom,
        normalizedRoomType
      );

      if (capacity != null) {
        const currentCount = await countActiveResidentsInRoom(normalizedBlock, normalizedRoom);

        if (currentCount >= capacity) {
          return res.status(400).json({
            success: false,
            message: `This room is full. Maximum ${capacity} resident(s) allowed for this room.`
          });
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || "12345678", 10);

    // Handle photo upload
    let photoData = null;
    const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);
    if (uploadedFile) {
      const base64Photo = uploadedFile.buffer.toString("base64");
      photoData = `data:${uploadedFile.mimetype};base64,${base64Photo}`;
    }

    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      block_number: normalizedBlock,
      room_number: normalizedRoom,
      room_type: normalizedRoomType,
      ac_status: normalizedAcStatus,
      photo: photoData,
      ...otherData,
      status: "ACTIVE"
    });

    await refreshRoomStatus(normalizedBlock, normalizedRoom);

    res.status(201).json({ 
      success: true, 
      message: "Resident added successfully", 
      data: user 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { status: "ACTIVE" },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]]
    });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getVacatedUsers = async (req, res) => {
  try {
    const users = await VacatedUser.findAll({
      order: [["vacatedAt", "DESC"]]
    });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const vacateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const previousBlock = user.block_number;
    const previousRoom = user.room_number;

    // Move to vacated list
    const vacatedData = {
      name: user.name,
      phone: user.phone,
      email: user.email,
      father_name: user.father_name,
      father_phone: user.father_phone,
      mother_phone: user.mother_phone,
      emergency_name: user.emergency_name,
      emergency_phone: user.emergency_phone,
      guardian_name: user.guardian_name,
      guardian_phone: user.guardian_phone,
      occupation: user.occupation,
      company_name: user.company_name,
      college_name: user.college_name,
      role: user.role
    };

    await VacatedUser.create(vacatedData);
    await user.destroy();
    await refreshRoomStatus(previousBlock, previousRoom);

    res.json({ 
      success: true, 
      message: "Resident vacated successfully and moved to vacated list" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const FORBIDDEN_USER_UPDATE_KEYS = new Set([
  "password",
  "role",
  "status",
  "id",
  "createdAt",
  "updatedAt"
]);

const buildUserUpdatesFromBody = (body) => {
  const updates = {};
  Object.keys(body || {}).forEach((key) => {
    if (FORBIDDEN_USER_UPDATE_KEYS.has(key)) return;
    const value = body[key];
    if (value === undefined) return;
    updates[key] = value;
  });
  return updates;
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check authorization: allow user to update own profile or admin to update any
    if (req.user.role !== "ADMIN" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only update your own profile" 
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const body = req.body || {};
    const previousBlock = user.block_number;
    const previousRoom = user.room_number;

    const updates = buildUserUpdatesFromBody(body);

    const nextBlock = String(updates.block_number ?? user.block_number ?? "").trim();
    const nextRoom = String(updates.room_number ?? user.room_number ?? "").trim();
    const nextRoomType = normalizeRoomType(updates.room_type ?? user.room_type);

    if (Object.prototype.hasOwnProperty.call(updates, "room_type")) {
      updates.room_type = nextRoomType;
    }
    if (Object.prototype.hasOwnProperty.call(updates, "ac_status")) {
      updates.ac_status = normalizeAcStatus(updates.ac_status);
    }

    const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);
    if (uploadedFile) {
      const base64Photo = uploadedFile.buffer.toString("base64");
      updates.photo = `data:${uploadedFile.mimetype};base64,${base64Photo}`;
    }

    const nextData = {
      ...user.toJSON(),
      ...updates,
      block_number: nextBlock || user.block_number,
      room_number: nextRoom || user.room_number,
      room_type: nextRoomType,
      ac_status: Object.prototype.hasOwnProperty.call(updates, "ac_status")
        ? updates.ac_status
        : normalizeAcStatus(user.ac_status)
    };

    if (nextBlock && nextRoom) {
      const roomMismatchError = await validateRoomDetailsMatch(
        nextBlock,
        nextRoom,
        nextRoomType,
        nextData.ac_status
      );
      if (roomMismatchError) {
        return res.status(400).json({
          success: false,
          message: roomMismatchError
        });
      }

      const capacity = await getRoomAssignmentCapacity(nextBlock, nextRoom, nextRoomType);

      if (capacity != null) {
        const currentCount = await countActiveResidentsInRoom(nextBlock, nextRoom, {
          excludeUserId: user.id
        });

        if (currentCount >= capacity) {
          return res.status(400).json({
            success: false,
            message: `This room is full. Maximum ${capacity} resident(s) allowed for this room.`
          });
        }
      }
    }

    if (updates.room_number !== undefined || updates.block_number !== undefined) {
      const rn = String(updates.room_number ?? user.room_number ?? "").trim();
      if (rn) {
        updates.floor_number = inferFloorNumber(rn);
      }
    }

    await user.update(updates);
    await user.reload({ attributes: { exclude: ["password"] } });

    const afterBlock = String(user.block_number ?? "").trim();
    const afterRoom = String(user.room_number ?? "").trim();

    await refreshRoomStatus(previousBlock, previousRoom);
    if (afterBlock && afterRoom) {
      await refreshRoomStatus(afterBlock, afterRoom);
    }

    res.json({
      success: true,
      message: "Resident updated successfully",
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const previousBlock = user.block_number;
    const previousRoom = user.room_number;

    await user.destroy();
    await refreshRoomStatus(previousBlock, previousRoom);

    res.json({ 
      success: true, 
      message: "Resident deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
