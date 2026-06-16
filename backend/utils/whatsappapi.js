import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER?.replace(/\s/g, '') || '';

export const sendWhatsApp = async (phone, message, retries = 2) => {
  let lastError = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (!phone || phone.trim() === "") {
        throw new Error("Invalid phone number: empty or null");
      }

      const hasValidTwilioSetup = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER;
      
      if (hasValidTwilioSetup) {
        const isSandboxNumber = TWILIO_WHATSAPP_NUMBER.includes("+14155238886");
        
        // FIX: Replaced process-breaking hard crash with a soft log alert
        if (!isSandboxNumber && TWILIO_WHATSAPP_NUMBER.startsWith('+91')) {
          console.log(`ℹ️ Production Note: Using a custom live WhatsApp number setup (${TWILIO_WHATSAPP_NUMBER}).`);
        }
        
        return await sendViatwilio(phone, message);
      }

      console.log(`📱 WhatsApp (Demo Mode - API not configured): To ${phone}`);
      console.log(`📝 Message: ${message}`);
      return { success: true, message: "Message logged (Demo Mode - API not configured)" };
    } catch (err) {
      lastError = err;
      const waitTime = Math.pow(2, attempt) * 1000; 
      
      if (attempt < retries) {
        console.warn(`⚠️  WhatsApp send attempt ${attempt + 1} failed for ${phone}. Retrying in ${waitTime}ms...`, err.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`❌ WhatsApp failed after ${retries + 1} attempts for ${phone}:`, err.message);
      }
    }
  }
  
  return { success: false, message: lastError?.message || "Failed to send WhatsApp after retries" };
};

const sendViatwilio = async (phone, message) => {
  try {
    if (!TWILIO_WHATSAPP_NUMBER) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured in .env file');
    }

    let cleanPhone = phone.replace(/\D/g, '').trim();
    
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Fallback assumes country code India
    }
    
    const toPhone = `whatsapp:+${cleanPhone}`;
    const fromPhone = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') 
      ? TWILIO_WHATSAPP_NUMBER 
      : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
    
    console.log(`📱 Twilio - From: ${fromPhone}, To: ${toPhone}`);

    if (fromPhone === toPhone) {
      throw new Error(`Cannot send message to yourself. TO phone (${cleanPhone}) cannot be same as FROM phone.`);
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append('From', fromPhone);
    params.append('To', toPhone);
    params.append('Body', message);

    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN
      },
      timeout: 15000
    });

    console.log(`✅ WhatsApp sent via Twilio to ${phone}`);
    return { success: true, data: response.data };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Unknown error";
    const errorCode = err.response?.data?.code;
    
    console.error(`❌ Twilio WhatsApp error for ${phone}:`, errorMsg);
    
    let helpfulMessage = `Twilio error: ${errorMsg}`;
    if (errorCode === 63007) {
      helpfulMessage = `❌ Error 63007 - Channel not found. Ensure TWILIO_WHATSAPP_NUMBER matches Twilio console exactly.`;
    }
    
    throw new Error(helpfulMessage);
  }
};

export const sendBulkWhatsApp = async (phones, message) => {
  try {
    return await Promise.allSettled(phones.map(phone => sendWhatsApp(phone, message)));
  } catch (err) {
    console.error("Bulk WhatsApp error:", err.message);
    throw err;
  }
};