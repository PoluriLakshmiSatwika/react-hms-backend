import express from "express";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";

const router = express.Router();

/* ✅ FETCH DOCTORS BY SPECIALTY */
router.get("/doctors/:specialty", async (req, res) => {
  try {
    const specialty = req.params.specialty;

    const doctors = await Doctor.find({ specialty })
      .select("fullName specialty department fee slots");

    // ✅ Fetch all booked slots for these doctors on any date (to show real availability)
    const bookedAppointments = await Appointment.find({
      doctorId: { $in: doctors.map(d => d._id) },
      status: { $ne: 'Cancelled' }
    }).select("doctorId slotTime appointmentDate");

    // ✅ Build a map of booked slots: { doctorId_date_slot: true }
    const bookedSlotsMap = {};
    bookedAppointments.forEach(apt => {
      const key = `${apt.doctorId}_${apt.appointmentDate?.toISOString().split('T')[0]}_${apt.slotTime}`;
      bookedSlotsMap[key] = true;
    });

    // ✅ Mark slots as booked in the response
    const doctorsWithSlotStatus = doctors.map(doc => ({
      ...doc.toObject(),
      slots: doc.slots?.map(slot => ({
        time: slot,
        isBooked: false // Default: all slots are available initially
        // Note: Frontend will compare with selected date to mark as booked
      }))
    }));

    res.json({
      success: true,
      count: doctors.length,
      doctors: doctorsWithSlotStatus,
      bookedSlotsMap  // Send booked slots map for frontend to use
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/* ✅ PATIENT VIEW BOOKINGS */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.patientId })
      .populate("doctorId", "fullName department specialty")
      .populate("assignedNurse", "fullName shift");

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ✅ DOCTOR VIEW OWN APPOINTMENTS */
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId })
      .populate("patientId", "fullName email phone")
      .populate("assignedNurse", "fullName shift available");

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ✅ BOOK APPOINTMENT — PREVENT SLOT DUPLICATE */
router.post("/book", async (req, res) => {
  try {
    const { patientId, doctorId, disease, appointmentDate, slotTime } = req.body;

    if (!patientId || !doctorId || !disease || !appointmentDate || !slotTime) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // 👉 Validate patient
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

    // 👉 Validate doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    // 👉 Check if same doctor slot already booked (prevent duplicate reservations)
    // Consider any appointment (pending or confirmed) as occupying the slot unless canceled
    const existing = await Appointment.findOne({
      doctorId,
      appointmentDate,
      slotTime,
      status: { $ne: 'Cancelled' }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This slot is already reserved or booked. Choose another.",
      });
    }

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      disease,
      appointmentDate,
      slotTime,
      assignedNurse: null,
      status: "Pending",
      feePaid: false,
      validityCount: 3,
    });

    await newAppointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment created (Pending)",
      appointmentId: newAppointment._id,   // ✅ Needed for Payment API
      data: newAppointment,
    });

  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/* ✅ DOCTOR ASSIGNS MULTIPLE NURSES */
router.put("/assign-nurses", async (req, res) => {
  try {
    const { appointmentId, nurseIds } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    appointment.assignedNurses = nurseIds; // ✅ multiple nurses
    appointment.status = "Confirmed";

    await appointment.save();

    res.json({
      success: true,
      message: "Nurses assigned & appointment confirmed!",
      data: appointment,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;