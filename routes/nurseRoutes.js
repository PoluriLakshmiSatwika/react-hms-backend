import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import PendingStaff from "../models/PendingStaff.js";
import Nurse from "../models/Nurse.js";  // ✅ Make sure the path is correct

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

// 🟡 Nurse Registration (pending_staff) with file upload
router.post("/register", upload.single("uploadId"), async (req, res) => {
  try {
    const { fullName, email, phone, department, shiftTiming, password } = req.body;

    const existingNurse = await PendingStaff.findOne({ email });
    if (existingNurse) {
      return res.status(400).json({ message: "Nurse already registered and pending approval" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPendingNurse = new PendingStaff({
      fullName,
      email,
      phone,
      role: "nurse",
      department,
      shiftTiming,
      password: hashedPassword,
      uploadId: req.file ? req.file.path : "",
      status: "pending",
    });

    await newPendingNurse.save(); // ✅ This line stores the document
    res.status(201).json({ message: "Nurse registration is pending for admin approval,try login to dashboard after some time", nurse: newPendingNurse });
  } catch (error) {
    console.error("Error registering nurse:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟢 Nurse Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Check if nurse exists in approved nurses table
    const nurse = await Nurse.findOne({ email });

    if (!nurse) {
      // Step 2: Check if still pending
      const pending = await PendingStaff.findOne({ email, role: "nurse" });

      if (pending) {
        return res.status(403).json({
          message:
            "Your account is pending admin approval. Please try again later.",
        });
      }

      return res
        .status(404)
        .json({ message: "No nurse found with this email address" });
    }

    // Step 3: Verify password
    const isMatch = await bcrypt.compare(password, nurse.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Step 4: Successful login
    res.status(200).json({
      message: "Nurse login successful",
      nurse: {
        id: nurse._id,
        name: nurse.fullName,
        email: nurse.email,
        department: nurse.department,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});
export default router;
