// controllers/circular.controller.js
import { Circular } from "../models/circular.model.js";
import { User } from "../models/user.model.js";
import { sendWhatsApp } from "../utils/whatsappapi.js";
import { sendEmail } from "../utils/emailapi.js";

export const sendCircular = async (req, res) => {
  try {
    const { title, message, sentVia } = req.body;

    console.log(`\n📢 Starting circular send - Title: "${title}", Sent Via: ${sentVia}`);

    // Create circular record
    const circular = await Circular.create({
      title,
      message,
      sentVia,
      status: "PENDING"
    });

    console.log(`📝 Circular created with ID: ${circular.id}`);

    // Get all active users
    const users = await User.findAll({
      where: { status: "ACTIVE" }
    });

    console.log(`👥 Found ${users.length} active users to send to:`);
    users.forEach(u => console.log(`   - ${u.name} (Phone: ${u.phone}, Email: ${u.email})`));

    let successCount = 0;
    let failureCount = 0;
    const failedNumbers = [];
    const failedEmails = [];
    const results = [];

    // Send via WhatsApp and/or Email
    if (sentVia === "WHATSAPP" || sentVia === "BOTH") {
      console.log(`\n📤 Sending WhatsApp messages...`);
      
      // Wait for all WhatsApp sends to complete before updating status
      const sendResults = await Promise.allSettled(
        users.map(async (user) => {
          try {
            // Validate phone number exists and is not empty
            if (!user.phone || user.phone.trim() === "") {
              throw new Error(`No phone number for user: ${user.name}`);
            }
            
            console.log(`   ⏳ Sending WhatsApp to ${user.name} (${user.phone})...`);
            const result = await sendWhatsApp(user.phone, `${title}\n\n${message}`);
            
            if (result.success) {
              successCount++;
              console.log(`   ✅ WhatsApp success for ${user.phone}`);
              results.push({ success: true, channel: "WHATSAPP", phone: user.phone, name: user.name });
              return { success: true, phone: user.phone };
            } else {
              failureCount++;
              failedNumbers.push(user.phone);
              console.log(`   ❌ WhatsApp failed for ${user.phone}: ${result.message}`);
              results.push({ success: false, channel: "WHATSAPP", phone: user.phone, name: user.name, error: result.message });
              return { success: false, phone: user.phone, error: result.message };
            }
          } catch (err) {
            failureCount++;
            failedNumbers.push(user.phone);
            console.error(`   ❌ WhatsApp error for ${user.phone}:`, err.message);
            results.push({ success: false, channel: "WHATSAPP", phone: user.phone, name: user.name, error: err.message });
            return { success: false, phone: user.phone, error: err.message };
          }
        })
      );
    }

    // Send via Email
    if (sentVia === "EMAIL" || sentVia === "BOTH") {
      console.log(`\n📧 Sending Email messages...`);
      
      const emailResults = await Promise.allSettled(
        users.map(async (user) => {
          try {
            // Validate email exists and is not empty
            if (!user.email || user.email.trim() === "") {
              throw new Error(`No email for user: ${user.name}`);
            }
            
            console.log(`   ⏳ Sending Email to ${user.name} (${user.email})...`);
            const result = await sendEmail(user.email, title, message);
            
            if (result.success) {
              successCount++;
              console.log(`   ✅ Email success for ${user.email}`);
              results.push({ success: true, channel: "EMAIL", email: user.email, name: user.name });
              return { success: true, email: user.email };
            } else {
              failureCount++;
              failedEmails.push(user.email);
              console.log(`   ❌ Email failed for ${user.email}: ${result.message}`);
              results.push({ success: false, channel: "EMAIL", email: user.email, name: user.name, error: result.message });
              return { success: false, email: user.email, error: result.message };
            }
          } catch (err) {
            failureCount++;
            failedEmails.push(user.email);
            console.error(`   ❌ Email error for ${user.email}:`, err.message);
            results.push({ success: false, channel: "EMAIL", email: user.email, name: user.name, error: err.message });
            return { success: false, email: user.email, error: err.message };
          }
        })
      );
    }

    console.log(`\n✅ Send operation complete - Success: ${successCount}, Failed: ${failureCount}\n`);

    // Check results and update circular status
    const finalStatus = failureCount > 0 ? "FAILED" : "SENT";
    await circular.update({ 
      status: finalStatus,
      metadata: JSON.stringify({
        totalUsers: users.length,
        successCount,
        failureCount,
        failedNumbers,
        failedEmails,
        results
      })
    });

    console.log(`📊 Circular ${circular.id}: Sent to ${successCount}/${users.length} users`);
    if (failureCount > 0) {
      console.warn(`⚠️  Failed numbers: ${failedNumbers.join(", ")}`);
      console.warn(`⚠️  Failed emails: ${failedEmails.join(", ")}`);
    }

    res.status(201).json({
      success: true,
      message: failureCount > 0 ? `Circular sent to ${successCount} users, failed for ${failureCount}` : "Circular sent successfully to all residents!",
      data: circular,
      stats: { successCount, failureCount, totalUsers: users.length, failedNumbers, failedEmails }
    });
  } catch (err) {
    console.error("❌ Circular send error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCirculars = async (req, res) => {
  try {
    const circulars = await Circular.findAll({
      order: [["sentAt", "DESC"]]
    });

    res.json({ success: true, data: circulars });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCircular = async (req, res) => {
  try {
    const { id } = req.params;
    const circular = await Circular.findByPk(id);

    if (!circular) {
      return res.status(404).json({ success: false, message: "Circular not found" });
    }

    await circular.destroy();
    res.json({ success: true, message: "Circular deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
