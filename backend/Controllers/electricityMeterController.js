// Controllers/electricityMeterController.js
import { ElectricityMeter } from "../models/electricityMeter.model.js";
import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { VacatedUser } from "../models/vacateduser.model.js";
import { Op } from "sequelize";

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
    const readingDate = reading_date ? new Date(reading_date) : new Date();
    const periodEnd = new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate());
    const periodStart = prevReadingDate
      ? new Date(prevReadingDate.getFullYear(), prevReadingDate.getMonth(), prevReadingDate.getDate())
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
      const joinDate = resident.join_date ? new Date(resident.join_date) : periodStart;
      const daysStayed = overlapDays(joinDate, periodEnd, periodStart, periodEnd);
      if (daysStayed > 0) entries.push({ type: "active", resident, daysStayed });
    });

    vacatedResidents.forEach((v) => {
      const joinDate = v.join_date ? new Date(v.join_date) : periodStart;
      const vacDate = v.vacatedAt ? new Date(v.vacatedAt) : periodEnd;
      const daysStayed = overlapDays(joinDate, vacDate, periodStart, periodEnd);
      if (daysStayed > 0) entries.push({ type: "vacated", vacated: v, daysStayed });
    });

    const totalPersonDays = entries.reduce((sum, e) => sum + e.daysStayed, 0);
    const updatedResidentsCount = entries.length;

    if (totalPersonDays > 0 && monthlyCharge > 0) {
      const perDayCharge = monthlyCharge / totalPersonDays;
      await Promise.all(entries.map(async (entry) => {
        const electricityShare = parseFloat((perDayCharge * entry.daysStayed).toFixed(2));
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
