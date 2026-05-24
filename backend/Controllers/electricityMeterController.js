// Controllers/electricityMeterController.js
import { ElectricityMeter } from "../models/electricityMeter.model.js";
import { Room } from "../models/room.model.js";

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
    const { current_reading, rate_per_unit } = req.body;

    const meter = await ElectricityMeter.findByPk(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: "Meter not found"
      });
    }

    const unitsConsumed = current_reading - (meter.current_reading || 0);
    const monthlyCharge = unitsConsumed * (rate_per_unit || meter.rate_per_unit || 0);

    meter.previous_reading = meter.current_reading;
    meter.current_reading = current_reading;
    meter.units_consumed = unitsConsumed;
    meter.rate_per_unit = rate_per_unit || meter.rate_per_unit;
    meter.monthly_charge = monthlyCharge;
    meter.last_reading_date = new Date();

    await meter.save();

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
        monthly_charge: monthlyCharge
      }
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
      rate_per_unit: rate_per_unit || 0,
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
