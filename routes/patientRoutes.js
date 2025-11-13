import express from "express";
import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ✅ Register patient route
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, dob, bloodGroup, medicalHistory, password } = req.body;

    // Check if email already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Use "patient" consistently
    const patient = new Patient({
      fullName: name,
      email,
      phone,
      dateOfBirth: dob,
      bloodGroup,
      medicalHistory,
      password: hashedPassword,
    });

    await patient.save(); // ✅ Correct variable name
    res.status(201).json({ message: "Patient registered successfully" });
  } catch (error) {
    console.error("❌ Error registering patient:", error);
    res.status(500).json({ message: "Error registering patient" });
  }
});


// ✅ Patient Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find patient by email
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // 2️⃣ Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // 3️⃣ Generate JWT token
    const token = jwt.sign(
      { id: patient._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    // 4️⃣ Return patient info and token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      patient: {
        _id: patient._id,
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        medicalHistory: patient.medicalHistory,
      },
    });

  } catch (error) {
    console.error("❌ Error logging in patient:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// // ✅ Patient Login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const patient = await Patient.findOne({ email });
//     if (!patient) return res.status(404).json({ message: "Patient not found" });

//     const isMatch = await bcrypt.compare(password, patient.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ id: patient._id }, "secretkey", { expiresIn: "1h" });
//     res.status(200).json({ message: "Login successful", token });
//   } catch (error) {
//     console.error("❌ Error logging in patient:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });




export default router;
