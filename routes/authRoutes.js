import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Doctor from "../models/Doctor.js";
import Nurse from "../models/Nurse.js";
import Patient from "../models/Patient.js";
import PendingStaff from "../models/PendingStaff.js"; // ✅ New model

const router = express.Router();

/* 🧠 Helper Function: Role-based Model Selector */
const getModelByRole = (role) => {
  switch (role.toLowerCase()) {
    case "admin":
      return Admin;
    case "doctor":
      return Doctor;
    case "nurse":
      return Nurse;
    case "patient":
      return Patient;
    default:
      return null;
  }
};

/* ✅ POST /api/auth/register — Register New User */
router.post("/register", async (req, res) => {
  try {
    const {
      role,
      fullName,
      email,
      phone,
      department,
      accessLevel,
      specialty,
      uploadId,
      shiftTiming,
      dateOfBirth,
      bloodGroup,
      medicalHistory,
      password,
    } = req.body;

    // Step 1: Basic validation
    if (!role || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Role, Email, and Password are required",
      });
    }

    const isDoctorOrNurse = ["doctor", "nurse"].includes(role.toLowerCase());
    const Model = getModelByRole(role);

    // Step 2: Check if already exists in active or pending collections
    const existingUser =
      (Model && (await Model.findOne({ email }))) ||
      (await PendingStaff.findOne({ email }));

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `${role} already registered or pending approval`,
      });
    }

    // Step 3: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4: Doctor/Nurse go to Pending Staff collection
    if (isDoctorOrNurse) {
      const newPending = new PendingStaff({
        role,
        fullName,
        email,
        phone,
        department,
        specialty,
        shiftTiming,
        uploadId,
        password: hashedPassword,
      });

      await newPending.save();

      return res.status(201).json({
        success: true,
        message: `${role} registration submitted for admin approval`,
        data: newPending,
      });
    }

    // Step 5: Direct registration for Admin/Patient
    let newUserData = { fullName, email, phone, password: hashedPassword };

    if (role === "admin") {
      newUserData.department = department;
      newUserData.accessLevel = accessLevel;
    } else if (role === "patient") {
      newUserData.dateOfBirth = dateOfBirth;
      newUserData.bloodGroup = bloodGroup;
      newUserData.medicalHistory = medicalHistory;
    }

    const newUser = new Model(newUserData);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role,
      },
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
});

/* 🔐 POST /api/auth/login — Authenticate User */
router.post("/login", async (req, res) => {
  try {
    const { role, email, password } = req.body;

    if (!role || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    // Step 1: Find user
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Step 2: Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Step 3: Generate JWT
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Step 4: Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: err.message,
    });
  }
});

/* ✅ POST /api/auth/approve — Admin Approves or Rejects Pending Staff */
router.post("/approve", async (req, res) => {
  try {
    const { id, approve } = req.body; // approve = true / false
    const pending = await PendingStaff.findById(id);

    if (!pending)
      return res.status(404).json({ message: "Pending staff not found" });

    // Reject case
    if (!approve) {
      await PendingStaff.findByIdAndDelete(id);
      return res.json({
        success: true,
        message: `${pending.role} registration rejected and removed`,
      });
    }

    // Approve case → Move to actual collection
    const hashedPassword = pending.password;

    if (pending.role === "doctor") {
      await Doctor.create({
        fullName: pending.fullName,
        email: pending.email,
        phone: pending.phone,
        department: pending.department,
        specialty: pending.specialty,
        uploadId: pending.uploadId,
        password: hashedPassword,
      });
    } else if (pending.role === "nurse") {
      await Nurse.create({
        fullName: pending.fullName,
        email: pending.email,
        phone: pending.phone,
        department: pending.department,
        shiftTiming: pending.shiftTiming,
        uploadId: pending.uploadId,
        password: hashedPassword,
      });
    }

    await PendingStaff.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `${pending.role} approved and moved to active staff list`,
    });
  } catch (error) {
    console.error("❌ Approval Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during approval",
      error: error.message,
    });
  }
});

/* ✅ GET /api/auth/pending — Get All Pending Staff (For Admin Dashboard) */
router.get("/pending", async (req, res) => {
  try {
    const pendingList = await PendingStaff.find();
    res.json({
      success: true,
      count: pendingList.length,
      data: pendingList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending staff",
      error: error.message,
    });
  }
});

/* ✅ Optional: Token Verification Route */
router.get("/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
});

export default router;