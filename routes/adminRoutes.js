// routes/adminRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";  // ✅ import Admin model
import Nurse from "../models/Nurse.js";
import Doctor from "../models/Doctor.js";
import nodemailer from "nodemailer";
import PendingStaff from "../models/PendingStaff.js";
const router = express.Router();

// ✅ Register Admin
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, department, accessLevel, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new admin
    const newAdmin = new Admin({
      name,
      email,
      phone,
      department,
      accessLevel,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    res.status(200).json({ message: "Login successful", adminId: admin._id });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ 1. Get all pending staff
router.get("/pending-staff", async (req, res) => {
  try {
    const pendingStaff = await PendingStaff.find();
    res.json(pendingStaff);
  } catch (error) {
    console.error("Error fetching pending staff:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 2. Approve staff
router.post("/approve/:id", async (req, res) => {
  try {
    const pendingStaff = await PendingStaff.findById(req.params.id);
    if (!pendingStaff)
      return res.status(404).json({ message: "Pending staff not found" });

    let newStaff;
    if (pendingStaff.role === "nurse") {
      newStaff = new Nurse({
        fullName: pendingStaff.fullName,
        email: pendingStaff.email,
        phone: pendingStaff.phone,
        department: pendingStaff.department,
        shiftTiming: pendingStaff.shiftTiming,
        password: pendingStaff.password,
        uploadId: pendingStaff.uploadId,
      });
    } 
    else if (pendingStaff.role === "doctor") {
  newStaff = new Doctor({
    fullName: pendingStaff.fullName,
    email: pendingStaff.email,
    phone: pendingStaff.phone,
    department: pendingStaff.department,
    // ✅ Fixed line: ensure specialty is always provided
    specialty:
      pendingStaff.specialty ||
      pendingStaff.specialization ||
      "General", // fallback if missing
    password: pendingStaff.password,
    uploadId: pendingStaff.uploadId,
  });
}

    await newStaff.save();
    await PendingStaff.findByIdAndDelete(req.params.id);

    // Send approval email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "satwikapoluri@gmail.com",
        pass: "qlvb txvy kbaw yphh", // Gmail app password
      },
    });

    await transporter.sendMail({
      from: '"HMS Admin" <satwikapoluri@gmail.com>',
      to: pendingStaff.email,
      subject: "Approval Confirmation",
      text: `Hello ${pendingStaff.fullName},\n\nYour registration as a ${pendingStaff.role} has been approved.\n\nWelcome to the Hospital Management System!\n\nRegards,\nHMS Admin`,
    });

    res.json({ message: `${pendingStaff.role} approved and notified via email` });
  } catch (error) {
    console.error("Error approving staff:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 3. Reject staff
router.post("/reject/:id", async (req, res) => {
  try {
    const pendingStaff = await PendingStaff.findById(req.params.id);
    if (!pendingStaff)
      return res.status(404).json({ message: "Pending staff not found" });

    // Send rejection email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "satwikapoluri@gmail.com",
        pass: "qlvb txvy kbaw yphh",
      },
    });

    await transporter.sendMail({
      from: '"HMS Admin" <satwikapoluri@gmail.com>',
      to: pendingStaff.email,
      subject: "Registration Rejected",
      text: `Hello ${pendingStaff.fullName},\n\nWe regret to inform you that your registration as a ${pendingStaff.role} has been rejected.\n\nRegards,\nHospital Management System`,
    });

    await PendingStaff.findByIdAndDelete(req.params.id);

    res.json({ message: "Staff rejected and notified via email" });
  } catch (error) {
    console.error("Error rejecting staff:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Doctors list
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Nurses list
router.get("/nurses", async (req, res) => {
  try {
    const nurses = await Nurse.find();
    res.json(nurses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
