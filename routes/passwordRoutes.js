import express from "express";
import { sendResetEmail } from "../utils/emailService.js"; // the working nodemailer setup
import Admin from "../models/Admin.js";
import Doctor from "../models/Doctor.js";
import Nurse from "../models/Nurse.js";
import Patient from "../models/Patient.js";
import crypto from "crypto";

const router = express.Router();

// Helper to get model
const getModelByRole = (role) => {
  switch(role.toLowerCase()) {
    case "admin": return Admin;
    case "doctor": return Doctor;
    case "nurse": return Nurse;
    case "patient": return Patient;
    default: return null;
  }
};

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ message: "Email and role required" });

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 15*60*1000; // 15 min
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendResetEmail(email, user.fullName || "User", resetLink);

    res.json({ success: true, message: "Reset link sent successfully" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
