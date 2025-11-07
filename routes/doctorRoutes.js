import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import PendingStaff from "../models/PendingStaff.js"; // your pending_staff collection model
import Doctor from "../models/Doctor.js";

const router = express.Router();

// ✅ Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// 🟢 Doctor Registration — stored in pending_staff until approved
router.post("/register", upload.single("uploadId"), async (req, res) => {
  try {
    const { name, email, phone, specialty, department, password } = req.body;

    // Check if doctor already pending or registered
    const existingPending = await PendingStaff.findOne({ email });
    if (existingPending) {
      return res.status(400).json({
        message: "Doctor already registered and awaiting admin approval.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to pending_staff collection
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

    res.status(201).json({
      message:
        "Doctor registration submitted successfully and is pending admin approval.",
      doctor: newPendingDoctor,
    });
  } catch (error) {
    console.error("Error registering doctor:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// 🟢 Doctor Login
// 🟢 Doctor Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // ✅ Use Doctor model instead of Admin
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      doctorId: doctor._id,
    });
  } catch (err) {
    console.error("Doctor login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ Get doctor appointments
router.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find(); // you can filter by doctorId if needed
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Assign nurses to appointment
router.post("/assign-nurses", async (req, res) => {
  const { appointmentId, nurseIds } = req.body;
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.assignedNurses = nurseIds;
    await appointment.save();

    // Optional: notify nurses via email
    const nurses = await Nurse.find({ _id: { $in: nurseIds } });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "satwikapoluri@gmail.com",
        pass: "qlvb txvy kbaw yphh",
      },
    });

    nurses.forEach((nurse) => {
      transporter.sendMail({
        from: '"HMS Admin" <satwikapoluri@gmail.com>',
        to: nurse.email,
        subject: `New Appointment Assigned`,
        text: `Hello ${nurse.fullName},\n\nYou have been assigned to an appointment on ${appointment.date}.\n\nRegards,\nHMS System`,
      });
    });

    res.json({ message: "Nurses assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find(); // fetch all doctors
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
