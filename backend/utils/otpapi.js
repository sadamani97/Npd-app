import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; 

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

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    // FIX: Use URLSearchParams instead of raw JSON object
    const params = new URLSearchParams();
    params.append('From', TWILIO_PHONE_NUMBER);
    params.append('To', phone);
    params.append('Body', `Your Hostel App OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`);

    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      // FIX: Clean, native basic authentication handling
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN
      }
    });

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
    console.log(`🔑 OTP (Demo Mode Fallback): ${otp} (for ${phone})`);
    return {
      success: true,
      mode: "DEMO",
      message: "OTP sent in demo mode (check console)"
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

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    // FIX: Form format mapping for WhatsApp OTP
    const params = new URLSearchParams();
    params.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER.replace(/\s/g, '')}`);
    params.append('To', `whatsapp:${phone}`);
    params.append('Body', `Your Hostel App OTP is: *${otp}*\n\nValid for 10 minutes.\nDo not share with anyone.`);

    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN
      }
    });

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
    console.log(`🔑 OTP (Demo Mode Fallback): ${otp} (for ${phone})`);
    return {
      success: true,
      mode: "DEMO",
      message: "OTP sent in demo mode (check console)"
    };
  }
};