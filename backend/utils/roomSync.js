import { Op } from "sequelize";
import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";

const ROOM_TYPE_CAPACITY = {
  SINGLE_SHARE: 1,
  DOUBLE_SHARE: 2,
  TRIPLE_SHARE: 3,
  FOUR_SHARE: 4,
  FIVE_SHARE: 5,
  SIX_SHARE: 6
};

const VALID_AC_STATUS = new Set(["AC", "NON_AC"]);

const ROOM_RENT_SCHEDULE = {
  SINGLE_SHARE: { AC: 10500, NON_AC: 9500, PREMIUM: 20000 },
  DOUBLE_SHARE: { AC: 7750, NON_AC: 7000, PREMIUM: 15000 },
  TRIPLE_SHARE: { AC: 7500, NON_AC: 6750, PREMIUM: 10000 },
  FOUR_SHARE: { AC: 7250, NON_AC: 6500 },
  FIVE_SHARE: { NON_AC: 6250 },
  SIX_SHARE: { NON_AC: 6000 }
};

const cleanValue = (value) => String(value ?? "").trim();
const cleanMoney = (value) => {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const calculateRoomRent = (roomType, acStatus, isPremium = false) => {
  const type = normalizeRoomType(roomType);
  const status = normalizeAcStatus(acStatus);
  const schedule = ROOM_RENT_SCHEDULE[type] || {};

  if (isPremium) {
    return schedule.PREMIUM || schedule.AC || schedule.NON_AC || 0;
  }

  if (status === "AC") {
    return schedule.AC || schedule.NON_AC || 0;
  }

  return schedule.NON_AC || 0;
};

export const normalizeRoomType = (roomType) => {
  const normalized = cleanValue(roomType).toUpperCase();
  return ROOM_TYPE_CAPACITY[normalized] ? normalized : "DOUBLE_SHARE";
};

export const normalizeAcStatus = (acStatus) => {
  const normalized = cleanValue(acStatus).toUpperCase();
  return VALID_AC_STATUS.has(normalized) ? normalized : "NON_AC";
};

export const inferFloorNumber = (roomNumber) => {
  const digits = cleanValue(roomNumber).match(/\d+/)?.[0];
  if (!digits) return "1";

  const numericRoom = Number.parseInt(digits, 10);
  if (!Number.isFinite(numericRoom) || numericRoom <= 0) return "1";

  return numericRoom >= 100
    ? String(Math.floor(numericRoom / 100))
    : String(Math.max(1, Math.ceil(numericRoom / 10)));
};

/** Max residents allowed: existing Room.capacity if set, else capacity from room_type. */
export const getRoomAssignmentCapacity = async (block_number, room_number, room_type) => {
  const bn = cleanValue(block_number);
  const rn = cleanValue(room_number);
  if (!bn || !rn) return null;

  const rt = normalizeRoomType(room_type);
  const typeCap = ROOM_TYPE_CAPACITY[rt] ?? 2;

  const existingRoom = await Room.findOne({
    where: { block_number: bn, room_number: rn }
  });

  const cap = existingRoom?.capacity != null ? Number(existingRoom.capacity) : null;
  if (Number.isFinite(cap) && cap >= 1) {
    return cap;
  }

  return typeCap;
};

export const countActiveResidentsInRoom = async (block_number, room_number, { excludeUserId } = {}) => {
  const bn = cleanValue(block_number);
  const rn = cleanValue(room_number);
  if (!bn || !rn) return 0;

  const where = {
    block_number: bn,
    room_number: rn,
    status: "ACTIVE"
  };

  if (excludeUserId != null) {
    where.id = { [Op.ne]: excludeUserId };
  }

  return User.count({ where });
};

export const ensureRoomForResident = async (residentData) => {
  const block_number = cleanValue(residentData?.block_number);
  const room_number = cleanValue(residentData?.room_number);

  if (!block_number || !room_number) return null;

  const room_type = normalizeRoomType(residentData?.room_type);
  const ac_status = normalizeAcStatus(residentData?.ac_status);
  const typeCapacity = ROOM_TYPE_CAPACITY[room_type] || 2;
  const requestedCapacity = Number.parseInt(residentData?.capacity, 10);
  const capacity = Number.isFinite(requestedCapacity) && requestedCapacity > 0
    ? requestedCapacity
    : typeCapacity;

  const existingRoom = await Room.findOne({
    where: { block_number, room_number }
  });

  if (!existingRoom) {
    return Room.create({
      block_number,
      room_number,
      floor_number: cleanValue(residentData?.floor_number) || inferFloorNumber(room_number),
      room_type,
      ac_status,
      capacity,
      base_rent: cleanMoney(residentData?.base_rent ?? residentData?.rent_amount),
      status: "OCCUPIED",
      electricity_meter_number:
        cleanValue(residentData?.electricity_meter_number) || `${block_number}-${room_number}`
    });
  }

  const updates = {};

  if (!existingRoom.floor_number) {
    updates.floor_number = cleanValue(residentData?.floor_number) || inferFloorNumber(room_number);
  }

  if (!existingRoom.electricity_meter_number) {
    updates.electricity_meter_number =
      cleanValue(residentData?.electricity_meter_number) || `${block_number}-${room_number}`;
  }

  if (!existingRoom.capacity || existingRoom.capacity < 1) {
    updates.capacity = capacity;
  }

  if (existingRoom.status === "AVAILABLE") {
    updates.status = "OCCUPIED";
  }

  return Object.keys(updates).length > 0
    ? existingRoom.update(updates)
    : existingRoom;
};

export const refreshRoomStatus = async (blockNumber, roomNumber) => {
  const block_number = cleanValue(blockNumber);
  const room_number = cleanValue(roomNumber);

  if (!block_number || !room_number) return null;

  const room = await Room.findOne({
    where: { block_number, room_number }
  });

  if (!room || room.status === "MAINTENANCE") return room;

  const occupants = await User.count({
    where: {
      block_number,
      room_number,
      status: "ACTIVE"
    }
  });

  const nextStatus = occupants > 0 ? "OCCUPIED" : "AVAILABLE";
  return room.status === nextStatus ? room : room.update({ status: nextStatus });
};

export const syncRoomsFromActiveResidents = async () => {
  const residents = await User.findAll({
    where: { status: "ACTIVE" },
    attributes: [
      "block_number",
      "room_number",
      "floor_number",
      "room_type",
      "ac_status",
      "rent_amount",
      "electricity_meter_number"
    ],
    raw: true
  });

  const roomKeys = new Set();

  for (const resident of residents) {
    const room = await ensureRoomForResident(resident);
    if (room) {
      roomKeys.add(`${room.block_number}::${room.room_number}`);
    }
  }

  const rooms = await Room.findAll({
    attributes: ["block_number", "room_number"],
    raw: true
  });

  for (const room of rooms) {
    roomKeys.add(`${room.block_number}::${room.room_number}`);
  }

  for (const roomKey of roomKeys) {
    const [blockNumber, roomNumber] = roomKey.split("::");
    await refreshRoomStatus(blockNumber, roomNumber);
  }
};
