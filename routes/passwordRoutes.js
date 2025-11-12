import express from "express";
import crypto from "crypto";
import Admin from "../models/Admin.js";
import Doctor from "../models/Doctor.js";
import Nurse from "../models/Nurse.js";
import Patient from "../models/Patient.js";
import { sendResetEmail } from "../routes/emailService.js";

const router = express.Router();

// Helper: get model by role
const getModelByRole = (role) => {
  switch (role.toLowerCase()) {
    case "admin": return Admin;
    case "doctor": return Doctor;
    case "nurse": return Nurse;
    case "patient": return Patient;
    default: return null;
  }
};

// 🔹 Forgot Password
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
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    // ✅ Frontend link with query param
    const resetLink = `${process.env.FRONTEND_URL}/#/reset-password?token=${token}`;

    await sendResetEmail(email, user.fullName || "User", resetLink);

    res.json({ success: true, message: "Reset link sent successfully" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// 🔹 Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token and new password required" });

    // Find user with token that hasn't expired
    const ModelList = [Admin, Doctor, Nurse, Patient];
    let userFound = null;
    let ModelUsed = null;

    for (const Model of ModelList) {
      const user = await Model.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() },
      });
      if (user) {
        userFound = user;
        ModelUsed = Model;
        break;
      }
    }

    if (!userFound) return res.status(400).json({ message: "Invalid or expired token" });

    userFound.password = newPassword; // Assuming you hash in pre-save middleware
    userFound.resetPasswordToken = undefined;
    userFound.resetPasswordExpire = undefined;
    await userFound.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
