import express from "express";
import PendingStaff from "../models/PendingStaff.js";

const router = express.Router();

// ✅ Doctor/Nurse registration → goes to pending_staff
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, role, department, specialty, shiftTiming, password } = req.body;

    const newPending = new PendingStaff({
      name,
      email,
      phone,
      role,
      department,
      specialty,
      shiftTiming,
      password,
      status: "pending",
    });

    await newPending.save();
    res.status(201).json({ message: "Registration pending admin approval" });
  } catch (error) {
    res.status(500).json({ message: "Error registering staff", error });
  }
});

export default router;
