import express from "express";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Payment from "../models/Payment.js";  // ✅ Add this
const router = express.Router();

/* ✅ FETCH DOCTORS BY DISEASE/SPECIALITY */
router.get("/doctors/:disease", async (req, res) => {
  try {
    const disease = req.params.disease;

    const doctors = await Doctor.find({ specialty: disease }).select(
      "fullName specialty department fee slots"
    );

    if (!doctors.length) {
      return res.status(404).json({ success: false, message: "No doctors found", doctors: [] });
    }

    res.json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ Get doctors by specialty (used in dropdown)
router.get("/doctors/:specialty", async (req, res) => {
  try {
    const doctors = await Doctor.find({ specialty: req.params.specialty });

    if (!doctors.length) {
      return res.status(404).json({ success: false, message: "No doctors found" });
    }

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});





router.post("/book", async (req, res) => {
  try {
    const { patientId, doctorId, disease, appointmentDate, slotTime } = req.body;

    // ✅ Check payment exists
    const payment = await Payment.findOne({
      patientId,
      doctorId,
      remainingSlots: { $gt: 0 }
    });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "Payment required before booking"
      });
    }

    // ✅ Reduce remaining slots
    payment.remainingSlots -= 1;
    await payment.save();

    // ✅ Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      disease,
      appointmentDate,
      slotTime,
      feePaid: true,
      paymentId: payment._id,
      validityCount: payment.remainingSlots,
      status: "Confirmed",
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointmentId: appointment._id,
      remainingSlots: payment.remainingSlots
    });

  } catch (err) {
    console.error("❌ Appointment Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* ✅ FETCH PATIENT APPOINTMENTS */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.patientId })
      .populate("doctorId", "fullName department specialty")
      .populate("assignedNurse", "fullName");

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ✅ FETCH DOCTOR APPOINTMENTS */
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId })
      .populate("patientId", "fullName email phone")
      .populate("assignedNurse", "fullName");

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ✅ ASSIGN NURSE & CONFIRM APPOINTMENT */
router.put("/assign-nurse", async (req, res) => {
  try {
    const { appointmentId, nurseId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    appointment.assignedNurse = nurseId;
    appointment.status = "Confirmed";
    await appointment.save();

    res.json({ success: true, message: "Nurse assigned & appointment confirmed", data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;