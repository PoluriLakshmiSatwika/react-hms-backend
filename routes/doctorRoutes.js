import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";

import PendingStaff from "../models/PendingStaff.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Assignment from "../models/Assignment.js";
import Nurse from "../models/Nurse.js";
import jwt from "jsonwebtoken";
const router = express.Router();

/* =================== Multer File Upload =================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/* =================== Doctor Registration =================== */
router.post("/register", upload.single("uploadId"), async (req, res) => {
  try {
    const { name, email, phone, specialty, department, password } = req.body;

    const existingPending = await PendingStaff.findOne({ email });
    if (existingPending) {
      return res.status(400).json({ message: "Doctor already registered and pending approval." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPendingDoctor = new PendingStaff({
      fullName: name,
      email,
      phone,
      role: "doctor",
      department,
      specialty,
      password: hashedPassword,
      uploadId: req.file ? req.file.path : "",
      status: "pending",
    });

    await newPendingDoctor.save();
    res.status(201).json({ message: "Registration submitted and pending approval.", doctor: newPendingDoctor });
  } catch (error) {
    console.error("Doctor registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

/* =================== Doctor Login =================== */


router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email & password required" });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // FIXED: Doctor.findOne instead of doctor.findOne
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // FIXED: JWT import + doctor data
    const token = jwt.sign(
      { id: doctor._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    // SUCCESS RESPONSE
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        phone: doctor.phone,
        department: doctor.department,
        specialty: doctor.specialty,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* =================== Fetch All Doctors or by Specialty =================== */

router.get("/doctors/:specialty", async (req, res) => {
  try {
    const { specialty } = req.params;

    // Case-insensitive match on specialty
    const doctors = await Doctor.find({
      specialty: { $regex: `^${specialty}$`, $options: "i" }
    });

    if (!doctors.length) {
      return res.json({ success: true, doctors: [], message: "No doctors found for this specialty" });
    }

    // Optional: prepare bookedSlotsMap if you want slot blocking logic
    const bookedSlotsMap = {}; // populate if you have appointments collection

    res.json({ success: true, doctors, bookedSlotsMap });
  } catch (err) {
    console.error("Fetch doctors error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* =================== Fetch All Appointments =================== */
router.get("/appointments", async (req, res) => {
  try {
    // Fetch appointments with assigned nurses (if any)
    const appointments = await Assignment.find().populate("appointmentId").populate("assignedNurses");
    res.json({ success: true, data: appointments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =================== Fetch Available Nurses =================== */
router.get("/nurses", async (req, res) => {
  try {
    const nurses = await Nurse.find({ available: true });
    res.json({ success: true, data: nurses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =================== Assign Nurses to Appointment =================== */
router.put("/assign-nurses", async (req, res) => {
  try {
    const { appointmentId, nurseIds } = req.body;

    if (!appointmentId || !Array.isArray(nurseIds)) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const nurses = await Nurse.find({ _id: { $in: nurseIds } });
    const nurseData = nurses.map(n => ({ nurseId: n._id, nurseName: n.fullName }));

    let assignment = await Assignment.findOne({ appointmentId });

    if (assignment) {
      assignment.assignedNurses = nurseData;
      await assignment.save();
    } else {
      assignment = await Assignment.create({ appointmentId, assignedNurses: nurseData });
    }

    // Optional: send email notifications to nurses
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    nurses.forEach(nurse => {
      transporter.sendMail({
        from: `"HMS Admin" <${process.env.EMAIL_USER}>`,
        to: nurse.email,
        subject: "New Appointment Assigned",
        text: `Hello ${nurse.fullName},\n\nYou have been assigned to an appointment on ${assignment.appointmentId.date}.\n\nRegards,\nHMS System`,
      });
    });

    res.json({ success: true, message: "Nurses assigned successfully", data: assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
