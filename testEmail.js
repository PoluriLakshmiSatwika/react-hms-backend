import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host:"smtp.gmail.com",
  logger: true,
  debug:true,
  auth:{
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.sendMail({
  from: `"HMS Test" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  subject: "Test Email",
  text: "This is a test email from HMS",
})
.then(info => console.log("✅ Test email sent:", info.response))
.catch(err => console.error("❌ Test email error:", err));
