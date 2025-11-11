import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/* ✅ Create Gmail transporter */
const transporter = nodemailer.createTransport({
  host:"smtp.gmail.com",
  logger: true,
  debug:true,
  auth:{
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
  
/* 🧩 Send Password Reset Email */
export const sendResetEmail = async (email, name, resetLink) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="background-color: #2E86C1; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">🏥 Hospital Management System</h1>
          </div>
          <div style="padding: 25px; text-align: left;">
            <p style="font-size: 16px;">Hi <strong>${name || "User"}</strong>,</p>
            <p style="font-size: 15px; color: #333;">
              We received a request to reset your password for your HMS account.
              Please click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetLink}" 
                style="background-color: #2E86C1; color: white; padding: 12px 24px; text-decoration: none;
                border-radius: 6px; font-weight: bold;">🔐 Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #666;">
              This link will expire in <strong>15 minutes</strong> for security reasons.<br>
              If you didn’t request a password reset, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 13px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Hospital Management System<br>
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      </div>
    `;

    console.log('Attempting to send email with config:', {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request'
    });

    const info = await transporter.sendMail({
      from: `"Hospital Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request – Hospital Management System",
      html: htmlContent,
    });

    console.log('✅ Reset email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
  } catch (error) {
    console.error('❌ Detailed email error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    throw error; // Re-throw to be handled by the route
  }
};

/* 👋 Send Welcome Email */
export const sendWelcomeEmail = async (email, name, role) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="background-color: #2E86C1; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">🏥 Hospital Management System</h1>
          </div>
          <div style="padding: 25px;">
            <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 15px; color: #333;">
              Welcome to <b>Hospital Management System</b>! 🎉<br><br>
              Your <strong>${role.toUpperCase()}</strong> account has been successfully
              ${role === "doctor" || role === "nurse" ? "approved by the admin" : "created"}.
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}"
                style="background-color: #2E86C1; color: white; padding: 12px 24px; text-decoration: none;
                border-radius: 6px; font-weight: bold;">🔗 Go to HMS Portal</a>
            </div>
            <p style="font-size: 14px; color: #666;">You can now log in and access your dashboard.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 13px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Hospital Management System<br>This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Hospital Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to HMS, ${name}!`,
      html: htmlContent,
    });

    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
  }
};