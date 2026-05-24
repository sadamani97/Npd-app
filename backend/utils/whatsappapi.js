import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Support both Twilio and Facebook Graph API
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// Clean phone number: remove spaces and ensure proper format
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER?.replace(/\s/g, '') || '';

// const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
// const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
// const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// Priority: Twilio > Facebook Graph API > Demo Mode
export const sendWhatsApp = async (phone, message, retries = 2) => {
  let lastError = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Validate phone number
      if (!phone || phone.trim() === "") {
        throw new Error("Invalid phone number: empty or null");
      }

      // Check if Twilio credentials are properly configured
      const hasValidTwilioSetup = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER;
      
      if (hasValidTwilioSetup) {
        // Check if the configured number looks like a Twilio sandbox number
        // Twilio sandbox numbers typically start with +1415 (San Francisco area code)
        // or other US numbers. Personal phone numbers are usually +91xxx for India
        const isSandboxNumber = TWILIO_WHATSAPP_NUMBER.includes("+14") || 
                               TWILIO_WHATSAPP_NUMBER.includes("+1-") ||
                               TWILIO_WHATSAPP_NUMBER.startsWith("+1");
        
        if (!isSandboxNumber) {
          throw new Error(
            `⚠️  WARNING: TWILIO_WHATSAPP_NUMBER (${TWILIO_WHATSAPP_NUMBER}) looks like a personal phone number!\n` +
            `Twilio sandbox uses numbers like +14155238886 (US-based).\n` +
            `Your number appears to be: ${TWILIO_WHATSAPP_NUMBER}\n\n` +
            `📝 To fix:\n` +
            `1. Go to: https://www.twilio.com/console/sms/whatsapp/sandbox\n` +
            `2. Find your assigned sandbox number (starts with +1)\n` +
            `3. Update .env: TWILIO_WHATSAPP_NUMBER=<your-sandbox-number>\n\n` +
            `Until then, messages will be sent in DEMO mode.`
          );
        }
        
        return await sendViatwilio(phone, message);
      }

      // Fallback to Facebook Graph API
      // if (WHATSAPP_PHONE_ID && WHATSAPP_TOKEN) {
      //   return await sendViaFbGraph(phone, message);
      // }

      // Demo mode - when API is not configured
      console.log(`📱 WhatsApp (Demo Mode - API not configured): To ${phone}`);
      console.log(`📝 Message: ${message}`);
      console.log(`⏭️  To use real WhatsApp:\n   1. Setup Twilio: https://www.twilio.com/console/sms/whatsapp/sandbox\n   2. Update .env with credentials`);
      return { success: true, message: "Message logged (Demo Mode - API not configured)" };
    } catch (err) {
      lastError = err;
      const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
      
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

// ✅ CORRECT: Using URLSearchParams for form-encoded data
const sendViatwilio = async (phone, message) => {
  try {
    // Validate from phone number
    if (!TWILIO_WHATSAPP_NUMBER) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured in .env file');
    }

    // Format phone number for Twilio - ensure it's clean and has country code
    let cleanPhone = phone.replace(/\D/g, '').trim();
    
    // If no country code (less than 10 digits), assume India (+91)
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    // If it starts with 91 but no +, it's fine
    else if (!cleanPhone.startsWith('91') && cleanPhone.length >= 10) {
      // Keep as is but ensure proper format
    }
    
    const toPhone = `whatsapp:+${cleanPhone}`;
    const fromPhone = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
    
    console.log(`📱 Twilio - From: ${fromPhone}, To: ${toPhone}`);

    // ⚠️ CHECK: Is FROM phone the same as TO phone?
    if (fromPhone === toPhone) {
      throw new Error(`Cannot send message to yourself. TO phone (${cleanPhone}) cannot be same as FROM phone (${TWILIO_WHATSAPP_NUMBER}). Ensure TWILIO_WHATSAPP_NUMBER in .env is set to Twilio's sandbox number, NOT a resident's phone number.`);
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // ✅ Use URLSearchParams for form-encoded data (NOT JSON!)
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
    console.log(`   Response SID: ${response.data.sid}`);
    return { success: true, data: response.data };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Unknown error";
    const errorCode = err.response?.data?.code;
    
    console.error(`❌ Twilio WhatsApp error for ${phone}:`, errorMsg);
    if (err.response?.data) {
      console.error(`   Error code: ${errorCode}`);
      console.error(`   Full error:`, err.response.data);
    }
    
    // Provide helpful error messages
    let helpfulMessage = `Twilio error: ${errorMsg}`;
    
    if (errorCode === 63007) {
      helpfulMessage = `❌ Error 63007 - Channel not found. Possible causes:\n` +
        `   1. TWILIO_WHATSAPP_NUMBER in .env is NOT the Twilio sandbox number\n` +
        `   2. It's set to a personal phone number instead\n` +
        `   3. Go to Twilio Console → WhatsApp → Sandbox Settings for correct number\n` +
        `   Original error: ${errorMsg}`;
    } else if (errorCode === 63031) {
      helpfulMessage = `❌ Error 63031 - Cannot send to same number (TO = FROM)\n` +
        `   This happens when TWILIO_WHATSAPP_NUMBER equals a resident's phone\n` +
        `   Make sure TWILIO_WHATSAPP_NUMBER is Twilio's sandbox number, not a personal phone!\n` +
        `   Original error: ${errorMsg}`;
    }
    
    throw new Error(helpfulMessage);
  }
};

// Facebook Graph API Integration
// const sendViaFbGraph = async (phone, message) => {
//   try {
//     // Format phone number for Facebook - ensure it's clean and has country code
//     let cleanPhone = phone.replace(/\D/g, '').trim();
    
//     // If no country code (10 digits), assume India (+91)
//     if (cleanPhone.length === 10) {
//       cleanPhone = '91' + cleanPhone;
//     }
    
//     const response = await axios.post(
//       `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
//       {
//         messaging_product: "whatsapp",
//         to: cleanPhone,
//         type: "text",
//         text: { body: message }
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${WHATSAPP_TOKEN}`,
//           "Content-Type": "application/json"
//         },
//         timeout: 10000
//       }
//     );

//     console.log(`✅ WhatsApp sent via Facebook API to ${phone}`);
//     return { success: true, data: response.data };
//   } catch (err) {
//     const errorMsg = err.response?.data?.message || err.message || "Unknown error";
//     console.error(`❌ FB Graph API error for ${phone}:`, errorMsg);
//     throw new Error(`Facebook API error: ${errorMsg}`);
//   }
// };

export const sendBulkWhatsApp = async (phones, message) => {
  try {
    const results = await Promise.allSettled(
      phones.map(phone => sendWhatsApp(phone, message))
    );
    return results;
  } catch (err) {
    console.error("Bulk WhatsApp error:", err.message);
    throw err;
  }
};