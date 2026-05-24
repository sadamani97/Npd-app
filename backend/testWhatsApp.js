// Test script to verify WhatsApp and Email configuration
import { sendWhatsApp } from "./utils/whatsappapi.js";
import { testEmailConfiguration, sendEmail } from "./utils/emailapi.js";
import dotenv from "dotenv";

dotenv.config();

const testIntegration = async () => {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║        🧪 Hostel App - WhatsApp & Email Test          ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Test WhatsApp Configuration
  console.log("📱 WHATSAPP CONFIGURATION:");
  console.log("─".repeat(55));
  console.log(`   TWILIO_ACCOUNT_SID:    ${process.env.TWILIO_ACCOUNT_SID ? "✅ Configured" : "❌ Missing"}`);
  console.log(`   TWILIO_AUTH_TOKEN:     ${process.env.TWILIO_AUTH_TOKEN ? "✅ Configured" : "❌ Missing"}`);
  console.log(`   TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER || "❌ Missing"}`);
  
  // Check if the number looks like a sandbox number
  const whatsappNum = process.env.TWILIO_WHATSAPP_NUMBER || "";
  if (whatsappNum.includes("+1")) {
    console.log(`   ✅ Looks like a valid Twilio sandbox number!`);
  } else if (whatsappNum.includes("+91")) {
    console.log(`   ⚠️  WARNING: Looks like a personal phone number (India +91)`);
    console.log(`      Get your sandbox number from: https://www.twilio.com/console/sms/whatsapp/sandbox`);
  }
  console.log("\n");

  // Test Email Configuration
  console.log("📧 EMAIL CONFIGURATION:");
  console.log("─".repeat(55));
  console.log(`   EMAIL_USER:       ${process.env.EMAIL_USER || "❌ Missing"}`);
  console.log(`   EMAIL_PASSWORD:   ${process.env.EMAIL_PASSWORD ? "✅ Configured" : "❌ Missing"}`);
  console.log(`   EMAIL_HOST:       ${process.env.EMAIL_HOST || "❌ Missing"}`);
  console.log(`   EMAIL_PORT:       ${process.env.EMAIL_PORT || "❌ Missing"}`);
  console.log("\n");

  // Test WhatsApp Send
  console.log("🚀 TESTING WHATSAPP MESSAGE SEND:");
  console.log("─".repeat(55));
  const testPhone = "8760154772";
  const testWhatsAppMessage = "🎉 This is a test message from your Hostel App!\n\nIf you received this, WhatsApp integration is working! ✅";

  console.log(`📤 Attempting to send WhatsApp to: ${testPhone}`);
  
  try {
    const whatsappResult = await sendWhatsApp(testPhone, testWhatsAppMessage);
    
    if (whatsappResult.success) {
      console.log("✅ WhatsApp test PASSED!");
      if (whatsappResult.data?.sid) {
        console.log(`   Message SID: ${whatsappResult.data.sid}`);
      }
    } else {
      console.log("⚠️  WhatsApp test sent (Demo Mode)");
      console.log(`   Message: ${whatsappResult.message}`);
    }
  } catch (err) {
    console.error("❌ WhatsApp error:", err.message);
  }

  console.log("\n");

  // Test Email Send
  console.log("🚀 TESTING EMAIL MESSAGE SEND:");
  console.log("─".repeat(55));
  const testEmail = "sadamanism97@gmail.com";
  const testEmailSubject = "🎉 Hostel App - Test Email";
  const testEmailBody = "This is a test email from your Hostel App!\n\nIf you received this, Email integration is working! ✅";

  console.log(`📤 Attempting to send Email to: ${testEmail}`);
  
  try {
    // First verify email configuration
    const emailConfigTest = await testEmailConfiguration();
    console.log("\n📊 Email Configuration Status:");
    console.log(emailConfigTest.message);
    
    if (emailConfigTest.success) {
      console.log("\n📤 Sending test email...");
      const emailResult = await sendEmail(testEmail, testEmailSubject, testEmailBody);
      
      if (emailResult.success) {
        console.log("✅ Email test PASSED!");
        if (emailResult.data?.messageId) {
          console.log(`   Message ID: ${emailResult.data.messageId}`);
        }
      } else {
        console.log("❌ Email test failed");
        console.log(`   Error: ${emailResult.message}`);
      }
    }
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }

  console.log("\n");
  
  // Summary and Next Steps
  console.log("📋 NEXT STEPS:");
  console.log("─".repeat(55));
  console.log("1. ✅ For Email: Configure your Gmail App Password");
  console.log("   → Go to: https://myaccount.google.com/apppasswords");
  console.log("   → Update EMAIL_PASSWORD in .env");
  console.log("\n2. ✅ For WhatsApp: Setup Twilio (free $15 credit)");
  console.log("   → Go to: https://www.twilio.com/try-twilio");
  console.log("   → Get Sandbox from: https://www.twilio.com/console/sms/whatsapp/sandbox");
  console.log("   → Update credentials in .env");
  console.log("\n3. 🚀 Start sending circulars from frontend!");
  console.log("   → Go to: Circulars → Send Circular");
  console.log("   → Choose Email/WhatsApp/Both");
  console.log("   → Click 'Send to All Residents'");
  console.log("\n");
  console.log("═".repeat(55));
  console.log("\n");
};

testIntegration();
