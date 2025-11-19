import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import PendingStaff from "../models/PendingStaff.js";
import Nurse from "../models/Nurse.js";
import Appointment from "../models/Appointment.js";
import { protectNurse } from "../middleware/authMiddleware.js"; // middleware to verify JWT
import Assignment from "../models/Assignment.js"; // adjust path as needed
import { getAssignedAppointments } from "../controllers/nurseController.js";
import mongoose from "mongoose";


const router = express.Router();

// ================== JWT Middleware ==================
const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1]; // Bearer token
  if (!token) return res.status(401).json({ success: false, message: "Not authorized, token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.nurse = await Nurse.findById(decoded.id).select("-password");
    if (!req.nurse) return res.status(401).json({ success: false, message: "Not authorized" });
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: "Token invalid" });
  }
};

// ================== Multer Setup ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ================== Nurse Registration ==================
router.post("/register", upload.single("uploadId"), async (req, res) => {
  try {
    const { fullName, email, phone, department, shiftTiming, password } = req.body;

    const existing = await PendingStaff.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: "Nurse already registered and pending approval" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPendingNurse = new PendingStaff({
      fullName,
      email: email.toLowerCase(),
      phone,
      role: "nurse",
      department,
      shiftTiming,
      password: hashedPassword,
      uploadId: req.file ? req.file.path : "",
      status: "pending",
    });

    await newPendingNurse.save();
    res.status(201).json({ success: true, message: "Nurse registration is pending admin approval", nurse: newPendingNurse });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== Nurse Login ==================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email & password required" });

    email = email.toLowerCase().trim();
    const nurse = await Nurse.findOne({ email });
    if (!nurse) return res.status(404).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, nurse.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: nurse._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "1h" });

    res.json({
      success: true,
      message: "Nurse login successful",
      token,
      nurse: {
        id: nurse._id,
        fullName: nurse.fullName,
        email: nurse.email,
        department: nurse.department,
        phone: nurse.phone,
        shiftTiming: nurse.shiftTiming,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
 });
// router.get("/appointments/:nurseId", protect, getAssignedAppointments);



// 📌 Get appointments assigned to a nurse
router.get("/appointments/:nurseId", protectNurse, async (req, res) => {
  try {
    const { nurseId } = req.params;

    const assignments = await Assignment.find({
      "assignedNurses.nurseId": nurseId
    })
      .populate({
  path: "appointmentId",
  populate: [
    { path: "doctorId", select: "fullName specialization" },
    { path: "patientId", select: "fullName phone age gender" }
  ]
})

      .exec();

    return res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });

  } catch (error) {
    console.error("Fetch Nurse Appointments Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// =============================
// 🟦 Accept Appointment
// =============================
router.put("/accept", async (req, res) => {
  try {
    const { appointmentId, nurseId } = req.body;

    // Update appointment status → Accepted
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    appointment.status = "Confirmed"; // nurse accepted
    await appointment.save();

    // Update assignment also
    await Assignment.updateOne(
      { appointmentId },
      { $set: { "assignedNurses.$[elem].status": "Accepted" } },
      { arrayFilters: [{ "elem.nurseId": nurseId }] }
    );

    res.json({ success: true, message: "Appointment accepted" });
  } catch (error) {
    console.error("Accept Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// =============================
// 🟩 Mark Appointment Completed
// =============================
router.put("/complete", async (req, res) => {
  try {
    const { appointmentId, nurseId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    appointment.status = "Completed";
    await appointment.save();

    // update assignment table also
    await Assignment.updateOne(
      { appointmentId },
      { $set: { "assignedNurses.$[elem].status": "Completed" } },
      { arrayFilters: [{ "elem.nurseId": nurseId }] }
    );

    res.json({ success: true, message: "Appointment marked completed" });
  } catch (error) {
    console.error("Completion Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;


