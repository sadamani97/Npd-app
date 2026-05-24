import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sadamanism97@gmail.com";
const EMAIL_USER = process.env.EMAIL_USER || ADMIN_EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = process.env.EMAIL_PORT || 587;

let transporter = null;

// Initialize email transporter
const initializeTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  return transporter;
};

/**
 * Send email to resident
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
export const sendEmail = async (toEmail, subject, message) => {
  try {
    // Validate email
    if (!toEmail || toEmail.trim() === "") {
      throw new Error("Invalid email: empty or null");
    }

    // If no email credentials configured, use demo mode
    if (!EMAIL_PASSWORD) {
      console.log(`📧 Email (Demo): To ${toEmail}, Subject: "${subject}"`);
      console.log(`📝 Message: ${message}`);
      return { 
        success: true, 
        message: "Email would be sent (Demo Mode - configure SMTP for real sending)" 
      };
    }

    const transport = initializeTransporter();

    // Email HTML template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">🏠 Hostel Management</h1>
        </div>
        <div style="padding: 20px; background-color: #f8f9fa;">
          <h2 style="color: #2c3e50; margin-top: 0;">${subject}</h2>
          <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">
${message}
          </div>
        </div>
        <div style="background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; border-radius: 0 0 8px 8px;">
          <p>📧 This is an automated message from your Hostel Management System</p>
          <p>Sent from: ${ADMIN_EMAIL}</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: EMAIL_USER,
      to: toEmail,
      subject: subject,
      html: htmlContent,
      text: message, // Plain text fallback
      replyTo: ADMIN_EMAIL
    };

    const info = await transport.sendMail(mailOptions);
    
    console.log(`✅ Email sent to ${toEmail}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { 
      success: true, 
      data: info,
      message: "Email sent successfully"
    };
  } catch (err) {
    const errorMsg = err.message || "Unknown error";
    console.error(`❌ Email error for ${toEmail}:`, errorMsg);
    
    return {
      success: false,
      message: `Email error: ${errorMsg}`
    };
  }
};

/**
 * Send bulk emails
 * @param {Array<string>} emails - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} message - Email body
 * @returns {Promise<Array>}
 */
export const sendBulkEmail = async (emails, subject, message) => {
  try {
    const results = await Promise.allSettled(
      emails.map(email => sendEmail(email, subject, message))
    );
    return results;
  } catch (err) {
    console.error("Bulk email error:", err.message);
    throw err;
  }
};

/**
 * Test email configuration
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testEmailConfiguration = async () => {
  try {
    if (!EMAIL_PASSWORD) {
      return {
        success: false,
        message: "❌ EMAIL_PASSWORD not configured in .env\n\nTo use email:\n1. Go to Gmail: https://gmail.com\n2. Enable 2FA: https://myaccount.google.com/security\n3. Generate App Password: https://myaccount.google.com/apppasswords\n4. Add to .env:\n   EMAIL_USER=sadamanism97@gmail.com\n   EMAIL_PASSWORD=<your-16-digit-app-password>\n   EMAIL_HOST=smtp.gmail.com\n   EMAIL_PORT=587"
      };
    }

    const transport = initializeTransporter();
    await transport.verify();

    return {
      success: true,
      message: `✅ Email configuration verified!\nConnected to: ${EMAIL_HOST}:${EMAIL_PORT}\nFrom: ${EMAIL_USER}`
    };
  } catch (err) {
    return {
      success: false,
      message: `❌ Email configuration error:\n${err.message}`
    };
  }
};
