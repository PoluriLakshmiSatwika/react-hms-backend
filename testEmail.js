import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

(async () => {
  try {
    console.log("🚀 Attempting to send test email via Resend...");

    const info = await resend.emails.send({
      from: "Hospital Management System <onboarding@resend.dev>",
      to: process.env.EMAIL_USER,
      subject: "✅ HMS Email Test via Resend",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🏥 Hospital Management System</h2>
          <p>This is a <b>test email</b> sent using <b>Resend API</b>.</p>
          <p>If you received this, your Render server email setup is working fine 🎉</p>
        </div>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log(info);
  } catch (error) {
    console.error("❌ Test email failed:", error);
  }
})();
