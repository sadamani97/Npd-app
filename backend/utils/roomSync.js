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
  SINGLE_SHARE: { AC: 10500, NON_AC: 9500, PREMIUM: 19999 },
  DOUBLE_SHARE: { AC: 7750, NON_AC: 7000, PREMIUM: 14999 },
  TRIPLE_SHARE: { AC: 7500, NON_AC: 6750, PREMIUM: 9999 },
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
  const str = cleanValue(roomNumber).toUpperCase();
  if (str.includes("G")) return "G";
  if (str.includes("F")) return "F";
  if (str.includes("S")) return "S";

  const digits = str.match(/\d+/)?.[0];
  if (!digits) return "G";

  const numericRoom = Number.parseInt(digits, 10);
  if (!Number.isFinite(numericRoom) || numericRoom <= 0) return "G";

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

export const HOSTEL_ROOM_DEFINITIONS = [
  // Block 1 Ground Floor (G)
  { block: "1", floor: "G", room: "1G1", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "G", room: "1G2", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "G", room: "1G3", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "G", room: "1G4", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "G", room: "1G5", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },

  // Block 1 1st Floor (F)
  { block: "1", floor: "F", room: "1F11", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "F", room: "1F12", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "F", room: "1F13", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "F", room: "1F14", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "F", room: "1F21", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "F", room: "1F22", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "F", room: "1F23", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "1", floor: "F", room: "1F24", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },

  // Block 1 2nd Floor (S)
  { block: "1", floor: "S", room: "1S11", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "1", floor: "S", room: "1S12", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "1", floor: "S", room: "1S13", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "1", floor: "S", room: "1S14", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "1", floor: "S", room: "1S21", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "1", floor: "S", room: "1S22", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "1", floor: "S", room: "1S23", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "1", floor: "S", room: "1S24", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },

  // Block 2 Ground Floor (G)
  { block: "2", floor: "G", room: "2G1", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "G", room: "2G2", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "G", room: "2G3", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "G", room: "2G4", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "G", room: "2G5", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },

  // Block 2 1st Floor (F)
  { block: "2", floor: "F", room: "2F11", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F12", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F13", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F21", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F22", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F23", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F31", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F32", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F33", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },
  { block: "2", floor: "F", room: "2F34", capacity: 4, type: "FOUR_SHARE", base_rent: 6500 },

  // Block 2 2nd Floor (S)
  { block: "2", floor: "S", room: "2S11", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S12", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S13", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S21", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S22", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S23", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S31", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S32", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S33", capacity: 6, type: "SIX_SHARE", base_rent: 6000 },
  { block: "2", floor: "S", room: "2S34", capacity: 6, type: "SIX_SHARE", base_rent: 6000 }
];

export const seedAllHostelRooms = async () => {
  try {
    for (const def of HOSTEL_ROOM_DEFINITIONS) {
      const existing = await Room.findOne({
        where: { block_number: def.block, room_number: def.room }
      });
      if (!existing) {
        await Room.create({
          block_number: def.block,
          floor_number: def.floor,
          room_number: def.room,
          room_type: def.type,
          capacity: def.capacity,
          base_rent: def.base_rent,
          ac_status: "NON_AC",
          status: "AVAILABLE",
          electricity_meter_number: `${def.block}-${def.room}`
        });
      }
    }
  } catch (err) {
    console.error("Error seeding hostel rooms:", err);
  }
};

export const syncRoomsFromActiveResidents = async () => {
  await seedAllHostelRooms();

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
