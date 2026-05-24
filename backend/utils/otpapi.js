// utils/otpapi.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // Twilio SMS number

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS using Twilio
 */
export const sendOTPviaSMS = async (phone, otp) => {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.log("⚠️  Twilio SMS not configured. OTP (Demo Mode):", otp);
      return {
        success: true,
        mode: "DEMO",
        message: "OTP sent in demo mode (check console)"
      };
    }

    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        From: TWILIO_PHONE_NUMBER,
        To: phone,
        Body: `Your Hostel App OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (response.data.sid) {
      return {
        success: true,
        mode: "TWILIO",
        message: "OTP sent successfully",
        sid: response.data.sid
      };
    }
  } catch (error) {
    console.error("Error sending OTP via SMS:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send OTP"
    };
  }
};

/**
 * Send OTP via WhatsApp using Twilio
 */
export const sendOTPviaWhatsApp = async (phone, otp) => {
  try {
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      console.log("⚠️  Twilio WhatsApp not configured. OTP (Demo Mode):", otp);
      return {
        success: true,
        mode: "DEMO",
        message: "OTP sent in demo mode (check console)"
      };
    }

    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        To: `whatsapp:${phone}`,
        Body: `Your Hostel App OTP is: *${otp}*\n\nValid for 10 minutes.\nDo not share with anyone.`
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (response.data.sid) {
      return {
        success: true,
        mode: "WHATSAPP",
        message: "OTP sent via WhatsApp",
        sid: response.data.sid
      };
    }
  } catch (error) {
    console.error("Error sending OTP via WhatsApp:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send OTP"
    };
  }
};
