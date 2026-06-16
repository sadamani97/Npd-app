// Controllers/electricityMeterController.js
import { ElectricityMeter } from "../models/electricityMeter.model.js";
import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { VacatedUser } from "../models/vacateduser.model.js";
import { Op } from "sequelize";

const stripTime = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
};

// Get all meters by block
export const getMetersByBlock = async (req, res) => {
  try {
    const { blockNumber } = req.params;

    const meters = await ElectricityMeter.findAll({
      where: { block_number: blockNumber },
      order: [['floor_number', 'ASC'], ['room_number', 'ASC']]
    });

    res.status(200).json({
      success: true,
      block_number: blockNumber,
      data: meters
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get specific meter details
export const getMeterDetails = async (req, res) => {
  try {
    const { meterId } = req.params;

    const meter = await ElectricityMeter.findByPk(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: "Meter not found"
      });
    }

    res.status(200).json({
      success: true,
      data: meter
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Record meter reading
export const recordMeterReading = async (req, res) => {
  try {
    const { meterId } = req.params;
    const { current_reading, rate_per_unit, reading_date } = req.body;

    const meter = await ElectricityMeter.findByPk(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: "Meter not found"
      });
    }

    const currentReading = Number(current_reading);
    if (isNaN(currentReading)) {
      return res.status(400).json({
        success: false,
        message: "Current reading must be a valid number"
      });
    }

    const previousReading = Number(meter.current_reading || 0);
    if (currentReading < previousReading) {
      return res.status(400).json({
        success: false,
        message: "Current reading must be greater than or equal to previous reading"
      });
    }

    const prevReadingDate = meter.last_reading_date ? new Date(meter.last_reading_date) : null;
    const unitsConsumed = currentReading - previousReading;
    const rate = Number(rate_per_unit ?? meter.rate_per_unit ?? 0);
    const monthlyCharge = unitsConsumed * rate;

    meter.previous_reading = meter.current_reading;
    meter.current_reading = currentReading;
    meter.units_consumed = unitsConsumed;
    meter.rate_per_unit = rate;
    meter.monthly_charge = monthlyCharge;
    meter.last_reading_date = reading_date ? new Date(reading_date) : new Date();

    await meter.save();

    // Determine billing period: from prior reading date (if present) to reading date or today
    const readingDate = reading_date ? stripTime(reading_date) : stripTime(new Date());
    const periodEnd = readingDate;
    const periodStart = prevReadingDate
      ? stripTime(prevReadingDate)
      : new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    const dayMs = 1000 * 60 * 60 * 24;

    const activeResidents = await User.findAll({
      where: {
        block_number: meter.block_number,
        room_number: meter.room_number,
        status: "ACTIVE"
      }
    });

    const vacatedResidents = await VacatedUser.findAll({
      where: {
        block_number: meter.block_number,
        room_number: meter.room_number,
        vacatedAt: { [Op.between]: [periodStart, periodEnd] }
      }
    });

    const entries = [];
    const overlapDays = (s1, e1, s2, e2) => {
      const start = s1 > s2 ? s1 : s2;
      const end = e1 < e2 ? e1 : e2;
      if (end < start) return 0;
      return Math.floor((end - start) / dayMs) + 1;
    };

    activeResidents.forEach((resident) => {
      const joinDate = resident.join_date ? stripTime(resident.join_date) : periodStart;
      const daysStayed = overlapDays(joinDate, periodEnd, periodStart, periodEnd);
      if (daysStayed > 0) {
        entries.push({ 
          type: "active", 
          resident, 
          daysStayed, 
          joinDate: joinDate > periodStart ? joinDate : periodStart, 
          endDate: periodEnd 
        });
      }
    });

    vacatedResidents.forEach((v) => {
      const joinDate = v.join_date ? stripTime(v.join_date) : periodStart;
      const vacDate = v.vacatedAt ? stripTime(v.vacatedAt) : periodEnd;
      const daysStayed = overlapDays(joinDate, vacDate, periodStart, periodEnd);
      if (daysStayed > 0) {
        entries.push({ 
          type: "vacated", 
          vacated: v, 
          daysStayed, 
          joinDate: joinDate > periodStart ? joinDate : periodStart, 
          endDate: vacDate < periodEnd ? vacDate : periodEnd 
        });
      }
    });

    const totalDays = Math.max(Math.floor((periodEnd - periodStart) / dayMs) + 1, 1);
    const dailyOccupancy = [];
    let activeDaysCount = 0;

    for (let d = 0; d < totalDays; d++) {
      const currentDayStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + d);
      const currentDayEnd = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + d, 23, 59, 59, 999);
      
      const todaysOccupants = [];
      entries.forEach((entry) => {
        const stayStart = new Date(entry.joinDate.getFullYear(), entry.joinDate.getMonth(), entry.joinDate.getDate());
        const stayEnd = new Date(entry.endDate.getFullYear(), entry.endDate.getMonth(), entry.endDate.getDate(), 23, 59, 59, 999);
        
        if (stayStart <= currentDayEnd && stayEnd >= currentDayStart) {
          todaysOccupants.push(entry);
        }
      });

      dailyOccupancy.push(todaysOccupants);
      if (todaysOccupants.length > 0) {
        activeDaysCount++;
      }
    }

    const divisorDays = activeDaysCount > 0 ? activeDaysCount : totalDays;
    const dailyCost = monthlyCharge / divisorDays;

    const finalShares = new Map();

    for (let d = 0; d < totalDays; d++) {
      const occupants = dailyOccupancy[d];
      const N = occupants.length;
      if (N > 0) {
        const sharePerPerson = dailyCost / N;
        occupants.forEach((entry) => {
          const currentVal = finalShares.get(entry) || 0;
          finalShares.set(entry, currentVal + sharePerPerson);
        });
      }
    }

    const updatedResidentsCount = entries.length;

    if (updatedResidentsCount > 0 && monthlyCharge > 0) {
      await Promise.all(entries.map(async (entry) => {
        const rawShare = finalShares.get(entry) || 0;
        const electricityShare = parseFloat(rawShare.toFixed(2));
        
        if (entry.type === "active") {
          const resident = entry.resident;
          resident.electricity_charges = electricityShare;
          resident.total_charges = parseFloat((parseFloat(resident.rent_amount || 0) + electricityShare).toFixed(2));
          await resident.save();
        } else {
          const v = entry.vacated;
          v.electricity_charges = electricityShare;
          v.total_charges = parseFloat((parseFloat(v.rent_amount || 0) + electricityShare).toFixed(2));
          await v.save();
        }
      }));
    }

    res.status(200).json({
      success: true,
      message: "Meter reading recorded successfully",
      data: {
        meter_id: meter.id,
        meter_number: meter.meter_number,
        previous_reading: meter.previous_reading,
        current_reading: meter.current_reading,
        units_consumed: unitsConsumed,
        rate_per_unit: meter.rate_per_unit,
        monthly_charge: monthlyCharge,
        updated_residents: updatedResidentsCount
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete meter reading data
export const deleteMeterReading = async (req, res) => {
  try {
    const { meterId } = req.params;
    const meter = await ElectricityMeter.findByPk(meterId);

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: "Meter not found"
      });
    }

    meter.previous_reading = 0;
    meter.current_reading = 0;
    meter.units_consumed = 0;
    meter.monthly_charge = 0;
    meter.last_reading_date = null;

    await meter.save();

    res.status(200).json({
      success: true,
      message: "Meter reading deleted successfully",
      data: {
        meter_id: meter.id,
        meter_number: meter.meter_number,
        previous_reading: meter.previous_reading,
        current_reading: meter.current_reading,
        units_consumed: meter.units_consumed,
        monthly_charge: meter.monthly_charge,
        last_reading_date: meter.last_reading_date
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete entire meter
export const deleteMeter = async (req, res) => {
  try {
    const { meterId } = req.params;
    const meter = await ElectricityMeter.findByPk(meterId);

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: "Meter not found"
      });
    }

    const deletedMeter = await meter.destroy();

    res.status(200).json({
      success: true,
      message: "Meter deleted successfully",
      data: deletedMeter
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Reset meter (clear all readings)
export const resetMeter = async (req, res) => {
  try {
    const { meterId } = req.params;
    const meter = await ElectricityMeter.findByPk(meterId);

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: "Meter not found"
      });
    }

    meter.previous_reading = 0;
    meter.current_reading = 0;
    meter.units_consumed = 0;
    meter.monthly_charge = 0;
    meter.last_reading_date = null;

    await meter.save();

    res.status(200).json({
      success: true,
      message: "Meter reset successfully",
      data: meter
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create new meter
export const createMeter = async (req, res) => {
  try {
    const { meter_number, block_number, floor_number, room_number, rate_per_unit } = req.body;

    const existingMeter = await ElectricityMeter.findOne({
      where: { meter_number }
    });

    if (existingMeter) {
      return res.status(400).json({
        success: false,
        message: "Meter with this number already exists"
      });
    }

    const meter = await ElectricityMeter.create({
      meter_number,
      block_number,
      floor_number,
      room_number,
      rate_per_unit: rate_per_unit || 14.00,
      status: "ACTIVE"
    });

    res.status(201).json({
      success: true,
      message: "Meter created successfully",
      data: meter
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get electricity consumption report
export const getConsumptionReport = async (req, res) => {
  try {
    const { blockNumber } = req.params;

    const meters = await ElectricityMeter.findAll({
      where: { block_number: blockNumber }
    });

    const totalUnits = meters.reduce((sum, meter) => sum + (meter.units_consumed || 0), 0);
    const totalCharge = meters.reduce((sum, meter) => sum + (meter.monthly_charge || 0), 0);

    res.status(200).json({
      success: true,
      block_number: blockNumber,
      report: {
        total_meters: meters.length,
        total_units_consumed: totalUnits,
        total_charge: totalCharge,
        average_consumption: meters.length > 0 ? (totalUnits / meters.length).toFixed(2) : 0,
        meters: meters
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Helper function to recalculate room electricity charges for all roommates
export const recalculateRoomElectricityCharges = async (block_number, room_number) => {
  try {
    const meter = await ElectricityMeter.findOne({
      where: { block_number, room_number }
    });

    const activeResidents = await User.findAll({
      where: {
        block_number,
        room_number,
        status: "ACTIVE"
      }
    });

    if (!meter) {
      // No meter: reset all active residents' charges to 0
      for (const resident of activeResidents) {
        resident.electricity_charges = 0.00;
        resident.total_charges = parseFloat((parseFloat(resident.rent_amount || 0)).toFixed(2));
        await resident.save();
      }
      return;
    }

    const monthlyCharge = Number(meter.monthly_charge || 0);

    if (monthlyCharge <= 0) {
      // Monthly charge is 0: reset all active residents' charges to 0
      for (const resident of activeResidents) {
        resident.electricity_charges = 0.00;
        resident.total_charges = parseFloat((parseFloat(resident.rent_amount || 0)).toFixed(2));
        await resident.save();
      }
      return;
    }

    const periodEnd = meter.last_reading_date ? stripTime(meter.last_reading_date) : stripTime(new Date());

    // Default periodStart to 1 month before periodEnd to reconstruct the billing cycle
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, periodEnd.getDate());
    
    const dayMs = 1000 * 60 * 60 * 24;

    const vacatedResidents = await VacatedUser.findAll({
      where: {
        block_number,
        room_number,
        vacatedAt: { [Op.between]: [periodStart, periodEnd] }
      }
    });

    const entries = [];
    const overlapDays = (s1, e1, s2, e2) => {
      const start = s1 > s2 ? s1 : s2;
      const end = e1 < e2 ? e1 : e2;
      if (end < start) return 0;
      return Math.floor((end - start) / dayMs) + 1;
    };

    activeResidents.forEach((resident) => {
      const joinDate = resident.join_date ? stripTime(resident.join_date) : periodStart;
      const daysStayed = overlapDays(joinDate, periodEnd, periodStart, periodEnd);
      if (daysStayed > 0) {
        entries.push({ 
          type: "active", 
          resident, 
          daysStayed, 
          joinDate: joinDate > periodStart ? joinDate : periodStart, 
          endDate: periodEnd 
        });
      } else {
        // Active but not in this billing period window
        entries.push({
          type: "active",
          resident,
          daysStayed: 0,
          joinDate: periodEnd,
          endDate: periodEnd
        });
      }
    });

    vacatedResidents.forEach((v) => {
      const joinDate = v.join_date ? stripTime(v.join_date) : periodStart;
      const vacDate = v.vacatedAt ? stripTime(v.vacatedAt) : periodEnd;
      const daysStayed = overlapDays(joinDate, vacDate, periodStart, periodEnd);
      if (daysStayed > 0) {
        entries.push({ 
          type: "vacated", 
          vacated: v, 
          daysStayed, 
          joinDate: joinDate > periodStart ? joinDate : periodStart, 
          endDate: vacDate < periodEnd ? vacDate : periodEnd 
        });
      }
    });

    const totalDays = Math.max(Math.floor((periodEnd - periodStart) / dayMs) + 1, 1);
    const dailyOccupancy = [];
    let activeDaysCount = 0;

    for (let d = 0; d < totalDays; d++) {
      const currentDayStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + d);
      const currentDayEnd = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + d, 23, 59, 59, 999);
      
      const todaysOccupants = [];
      entries.forEach((entry) => {
        if (entry.daysStayed === 0) return;
        const stayStart = new Date(entry.joinDate.getFullYear(), entry.joinDate.getMonth(), entry.joinDate.getDate());
        const stayEnd = new Date(entry.endDate.getFullYear(), entry.endDate.getMonth(), entry.endDate.getDate(), 23, 59, 59, 999);
        
        if (stayStart <= currentDayEnd && stayEnd >= currentDayStart) {
          todaysOccupants.push(entry);
        }
      });

      dailyOccupancy.push(todaysOccupants);
      if (todaysOccupants.length > 0) {
        activeDaysCount++;
      }
    }

    const divisorDays = activeDaysCount > 0 ? activeDaysCount : totalDays;
    const dailyCost = monthlyCharge / divisorDays;

    const finalShares = new Map();

    for (let d = 0; d < totalDays; d++) {
      const occupants = dailyOccupancy[d];
      const N = occupants.length;
      if (N > 0) {
        const sharePerPerson = dailyCost / N;
        occupants.forEach((entry) => {
          const currentVal = finalShares.get(entry) || 0;
          finalShares.set(entry, currentVal + sharePerPerson);
        });
      }
    }

    await Promise.all(entries.map(async (entry) => {
      const rawShare = finalShares.get(entry) || 0;
      const electricityShare = parseFloat(rawShare.toFixed(2));
      
      if (entry.type === "active") {
        const resident = entry.resident;
        resident.electricity_charges = electricityShare;
        resident.total_charges = parseFloat((parseFloat(resident.rent_amount || 0) + electricityShare).toFixed(2));
        await resident.save();
      } else {
        const v = entry.vacated;
        v.electricity_charges = electricityShare;
        v.total_charges = parseFloat((parseFloat(v.rent_amount || 0) + electricityShare).toFixed(2));
        await v.save();
      }
    }));
  } catch (err) {
    console.error("Error in recalculateRoomElectricityCharges:", err);
  }
};
