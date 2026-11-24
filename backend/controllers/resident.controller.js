import { User } from "../models/user.model.js";
import { VacatedUser } from "../models/vacateduser.model.js";
import { Room } from "../models/room.model.js";
import { ElectricityMeter } from "../models/electricityMeter.model.js";
import { recalculateRoomElectricityCharges } from "./electricityMeter.controller.js";
import {
  refreshRoomStatus,
  normalizeRoomType,
  normalizeAcStatus,
  getRoomAssignmentCapacity,
  countActiveResidentsInRoom,
  inferFloorNumber
} from "../utils/roomSync.js";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";
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

    // Check if user already exists by email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    // Check if user already exists by phone
    const existingUserByPhone = await User.findOne({ where: { phone } });
    if (existingUserByPhone) {
      return res.status(400).json({ success: false, message: "User with this phone number already exists" });
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

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
      hostel_id: req.user.hostel_id || otherData.hostel_id || null,
      status: "ACTIVE"
    });

    if (normalizedBlock && normalizedRoom) {
      const room = await Room.findOne({
        where: { block_number: normalizedBlock, room_number: normalizedRoom }
      });
      if (room) {
        user.rent_amount = room.base_rent || user.rent_amount;
        user.total_charges = parseFloat((parseFloat(user.rent_amount || 0) + parseFloat(user.electricity_charges || 0)).toFixed(2));
        await user.save();
      }
    }

    await refreshRoomStatus(normalizedBlock, normalizedRoom);

    // Sync initial electricity meter reading if provided
    const initialMeterReading = body.electricity_meter_reading;
    if (normalizedBlock && normalizedRoom && initialMeterReading !== undefined && initialMeterReading !== "") {
      const readingVal = parseFloat(initialMeterReading);
      if (!isNaN(readingVal)) {
        let meter = await ElectricityMeter.findOne({
          where: { block_number: normalizedBlock, room_number: normalizedRoom }
        });
        if (meter) {
          const prev = Number(meter.current_reading || 0);
          const units = readingVal - prev;
          meter.previous_reading = prev;
          meter.current_reading = readingVal;
          meter.units_consumed = units >= 0 ? units : 0;
          meter.monthly_charge = meter.units_consumed * (meter.rate_per_unit || 14.00);
          meter.last_reading_date = new Date();
          await meter.save();
        } else {
          const roomObj = await Room.findOne({
            where: { block_number: normalizedBlock, room_number: normalizedRoom }
          });
          const meterNumber = roomObj?.electricity_meter_number || `M-${normalizedBlock}-${normalizedRoom}`;
          await ElectricityMeter.create({
            meter_number: meterNumber,
            block_number: normalizedBlock,
            floor_number: roomObj?.floor_number || String(normalizedRoom[0] || "1"),
            room_number: normalizedRoom,
            current_reading: readingVal,
            previous_reading: readingVal,
            units_consumed: 0,
            monthly_charge: 0,
            last_reading_date: new Date(),
            rate_per_unit: 14.00,
            status: "ACTIVE"
          });
        }
      }
    }

    if (normalizedBlock && normalizedRoom) {
      await recalculateRoomElectricityCharges(normalizedBlock, normalizedRoom);
      await user.reload();
    }

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
    const where = { status: "ACTIVE", role: "USER" };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(where, getHostelFilter(req.user));
    }
    const users = await User.findAll({
      where,
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

    if (req.user.role !== "SUPER_ADMIN" && user.hostel_id && req.user.hostel_id !== user.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
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

    // include room and date information to allow precise billing calculations
    vacatedData.block_number = user.block_number;
    vacatedData.floor_number = user.floor_number;
    vacatedData.room_number = user.room_number;
    vacatedData.join_date = user.join_date;
    vacatedData.rent_amount = user.rent_amount;
    vacatedData.electricity_charges = user.electricity_charges;
    vacatedData.total_charges = user.total_charges;

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
    if (req.user.role !== "ADMIN" && req.user.role !== "HOSTEL_ADMIN" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only update your own profile" 
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.user.role !== "SUPER_ADMIN" && user.hostel_id && req.user.hostel_id !== user.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
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

    if (nextBlock && nextRoom) {
      const room = await Room.findOne({
        where: { block_number: nextBlock, room_number: nextRoom }
      });
      if (room) {
        user.rent_amount = room.base_rent || user.rent_amount;
        user.total_charges = parseFloat((parseFloat(user.rent_amount || 0) + parseFloat(user.electricity_charges || 0)).toFixed(2));
        await user.save();
      }
    }

    const afterBlock = String(user.block_number ?? "").trim();
    const afterRoom = String(user.room_number ?? "").trim();

    // Reset meter for old room if resident changed rooms
    if ((previousBlock && previousRoom) && (previousBlock !== afterBlock || previousRoom !== afterRoom)) {
      try {
        const oldMeter = await ElectricityMeter.findOne({
          where: {
            block_number: previousBlock,
            room_number: previousRoom
          }
        });
        if (oldMeter) {
          oldMeter.previous_reading = 0;
          oldMeter.current_reading = 0;
          oldMeter.units_consumed = 0;
          oldMeter.monthly_charge = 0;
          oldMeter.last_reading_date = null;
          await oldMeter.save();
        }
      } catch (e) {
        console.log("Note: Could not reset meter for old room:", e.message);
      }
    }

    await refreshRoomStatus(previousBlock, previousRoom);
    if (afterBlock && afterRoom) {
      await refreshRoomStatus(afterBlock, afterRoom);
    }

    // Sync initial/current electricity meter reading if provided
    const initialMeterReading = body.electricity_meter_reading;
    if (afterBlock && afterRoom && initialMeterReading !== undefined && initialMeterReading !== "") {
      const readingVal = parseFloat(initialMeterReading);
      if (!isNaN(readingVal)) {
        let meter = await ElectricityMeter.findOne({
          where: { block_number: afterBlock, room_number: afterRoom }
        });
        if (meter) {
          const prev = Number(meter.current_reading || 0);
          const units = readingVal - prev;
          meter.previous_reading = prev;
          meter.current_reading = readingVal;
          meter.units_consumed = units >= 0 ? units : 0;
          meter.monthly_charge = meter.units_consumed * (meter.rate_per_unit || 14.00);
          meter.last_reading_date = new Date();
          await meter.save();
        } else {
          const roomObj = await Room.findOne({
            where: { block_number: afterBlock, room_number: afterRoom }
          });
          const meterNumber = roomObj?.electricity_meter_number || `M-${afterBlock}-${afterRoom}`;
          await ElectricityMeter.create({
            meter_number: meterNumber,
            block_number: afterBlock,
            floor_number: roomObj?.floor_number || String(afterRoom[0] || "1"),
            room_number: afterRoom,
            current_reading: readingVal,
            previous_reading: readingVal,
            units_consumed: 0,
            monthly_charge: 0,
            last_reading_date: new Date(),
            rate_per_unit: 14.00,
            status: "ACTIVE"
          });
        }
      }
    }

    if (previousBlock && previousRoom && (previousBlock !== afterBlock || previousRoom !== afterRoom)) {
      await recalculateRoomElectricityCharges(previousBlock, previousRoom);
    }
    if (afterBlock && afterRoom) {
      await recalculateRoomElectricityCharges(afterBlock, afterRoom);
      await user.reload();
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

    if (req.user.role !== "SUPER_ADMIN" && user.hostel_id && req.user.hostel_id !== user.hostel_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const previousBlock = user.block_number;
    const previousRoom = user.room_number;

    await user.destroy();
    await refreshRoomStatus(previousBlock, previousRoom);
    if (previousBlock && previousRoom) {
      await recalculateRoomElectricityCharges(previousBlock, previousRoom);
    }

    res.json({ 
      success: true, 
      message: "Resident deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
