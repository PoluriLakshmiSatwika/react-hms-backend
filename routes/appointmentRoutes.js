import express from "express";
import Appointment from "../models/Appointment.js";

const router = express.Router();

// GET all appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// POST new appointment
router.post("/", async (req, res) => {
  try {
    const { doctorId, patientId, date } = req.body;
    const newAppointment = new Appointment({ doctorId, patientId, date });
    await newAppointment.save();
    res.status(201).json({ message: "Appointment booked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to book appointment" });
  }
});

export default router;
