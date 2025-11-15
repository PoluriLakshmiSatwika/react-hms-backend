import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import PendingStaff from "../models/PendingStaff.js";
import Nurse from "../models/Nurse.js";
import Appointment from "../models/Appointment.js";
import { getNurseProfile } from "../controllers/nurseController.js";
import { protectNurse } from "../middleware/authMiddleware.js"; // middleware to verify JWT
import Assignment from "../models/Assignment.js"; // adjust path as needed

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
// // Add this route
// router.get("/profile", protectNurse, getNurseProfile);
// // ================== Fetch Assignments ==================
// router.get("/assignments", protectNurse, async (req, res) => {

//   try {
//     const nurseId = req.nurse._id.toString(); // convert to string

//     // Find assignments where this nurse is assigned
//     const assignments = await Assignment.find({
//       "assignedNurses.nurseId": nurseId
//     })
//      .populate("patientId", "fullName email phone")  // only if Assignment has patientId as ObjectId
//   .lean(); // optional, returns plain JS objects

//     res.json({ success: true, data: assignments });
//   } catch (err) {
//     console.error("Assignments fetch error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
// //============== Update Availability ==================
// router.put("/availability", protectNurse, async (req, res) => {

//     try {
//     const { available } = req.body;
//     await Nurse.findByIdAndUpdate(req.nurse._id, { available });
//     res.json({ success: true, message: `Availability set to ${available ? "Online" : "Offline"}` });
//   } catch (err) {
//     console.error("Update availability error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
//    //5️⃣ ACCEPT ASSIGNMENT (OFFLINE BLOCK ADDED)

// // ================== Accept Assignment ==================
// router.put("/assignments/:id/accept", protectNurse, async (req, res) => {
//   try {
//     const assignmentId = req.params.id;
//     const nurse = req.nurse;

//     if (!nurse.available)
//       return res.status(400).json({ success: false, message: "You are offline. Go online to accept appointments." });

//     const assignment = await Assignment.findById(assignmentId);
//     if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

//     // Check if this nurse is assigned
//     const isAssigned = assignment.assignedNurses.some(n => n.nurseId === nurse._id.toString());
//     if (!isAssigned)
//       return res.status(403).json({ success: false, message: "You are not assigned to this appointment" });

//     if (assignment.status && assignment.status !== "Pending")
//       return res.status(400).json({ success: false, message: "This assignment is no longer pending" });

//     assignment.status = "Accepted";
//     await assignment.save();

//     res.json({ success: true, data: assignment });
//   } catch (err) {
//     console.error("Accept assignment error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // ================== Complete Assignment ==================
// router.put("/assignments/:id/complete", protectNurse, async (req, res) => {
//   try {
//     const assignmentId = req.params.id;
//     const nurse = req.nurse;

//     const assignment = await Assignment.findById(assignmentId);
//     if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

//     const isAssigned = assignment.assignedNurses.some(n => n.nurseId === nurse._id.toString());
//     if (!isAssigned)
//       return res.status(403).json({ success: false, message: "You are not assigned to this appointment" });

//     if (assignment.status !== "Accepted")
//       return res.status(400).json({ success: false, message: "You must accept the assignment before completing it" });

//     assignment.status = "Completed";
//     await assignment.save();

//     res.json({ success: true, data: assignment });
//   } catch (err) {
//     console.error("Complete assignment error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
// ================== Nurse Profile ==================
router.get("/profile", protectNurse, getNurseProfile);

// ================== Fetch Assignments ==================
router.get("/assignments", protectNurse, async (req, res) => {
  try {
    const nurseId = req.nurse._id.toString();

    // Find assignments where this nurse is assigned
    const assignments = await Assignment.find({
      "assignedNurses.nurseId": nurseId
    })
      .populate("patientId", "fullName email phone")
      .lean();
      
    // Add a fallback field `patientName` if patientId is missing
    const formattedAssignments = assignments.map(a => ({
      ...a,
      displayPatientName: a.patientId?.fullName || a.patientName || "Unknown"
    }));


    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error("Assignments fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== Accept Assignment ==================
// Accept Assignment
router.put("/assignments/:id/accept", protectNurse, async (req, res) => {
  try {
    const { id } = req.params;
    const nurse = req.nurse;

    const assignment = await Assignment.findById(id);
    if (!assignment)
      return res.status(404).json({ success: false, message: "Assignment not found" });

    const nurseEntry = assignment.assignedNurses.find(
      (n) => n.nurseId === nurse._id.toString()
    );

    if (!nurseEntry)
      return res.status(403).json({ success: false, message: "You are not assigned to this appointment" });

    if (nurseEntry.status !== "Pending")
      return res.status(400).json({ success: false, message: "Already accepted or completed" });

    nurseEntry.status = "Accepted";
    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (err) {
    console.error("Accept assignment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// ================== Complete Assignment ==================
router.put("/assignments/:id/complete", protectNurse, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const nurse = req.nurse;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ success: false, message: "Assignment not found" });

    const isAssigned = assignment.assignedNurses.some(
      (n) => n.nurseId.toString() === nurse._id.toString()
    );
    if (!isAssigned)
      return res.status(403).json({ success: false, message: "You are not assigned to this appointment" });

    if (assignment.status !== "Accepted")
      return res.status(400).json({ success: false, message: "You must accept the assignment before completing it" });

    assignment.status = "Completed";
    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (err) {
    console.error("Complete assignment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;
