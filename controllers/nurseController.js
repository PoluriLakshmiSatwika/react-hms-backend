// controllers/nurseController.js

import Appointment from "../models/Appointment.js";

export const getAssignedAppointments = async (req, res) => {
  try {
    const { nurseId } = req.params;

    const appointments = await Appointment.find({
      "assignedNurses.nurseId": nurseId
    })
      .populate("patientId", "fullName age gender")
      .populate("doctorId", "fullName specialization")
      .populate("assignedNurses.nurseId", "fullName");

    res.json({
      success: true,
      data: appointments,
    });

  } catch (error) {
    console.error("Error fetching nurse appointments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
