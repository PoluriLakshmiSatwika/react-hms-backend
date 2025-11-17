import express from "express";
import Assignment from "../models/Assignment.js";
import Appointment from "../models/Appointment.js";
import Nurse from "../models/Nurse.js";

const router = express.Router();
// PUT /api/assignments
router.put("/", async (req, res) => {
  const { appointmentId, nurseIds } = req.body;

  try {
    // 1️⃣ Fetch appointment with patient
    const appointment = await Appointment.findById(appointmentId).populate("patientId");
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (!appointment.patientId) {
      return res.status(400).json({ success: false, message: "Appointment has no patient assigned" });
    }

    // 2️⃣ Fetch nurses
    const nurses = await Nurse.find({ _id: { $in: nurseIds } });
    const assignedNurses = nurses.map(n => ({
      nurseId: n._id,
      nurseName: n.fullName,
      status: "Pending"
    }));

    // 3️⃣ Check for existing assignment
    let assignment = await Assignment.findOne({ appointmentId });
    if (assignment) {
      assignment.assignedNurses = assignedNurses;
    } else {
      assignment = new Assignment({
        appointmentId,
        patientId: appointment.patientId._id, // ✅ REQUIRED field
        date: appointment.appointmentDate,
        time: appointment.slotTime,
        assignedNurses,
      });
    }

    await assignment.save();
    res.json({ success: true, data: assignment });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
