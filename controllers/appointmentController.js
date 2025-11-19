// controllers/appointmentController.js

import Appointment from "../models/Appointment.js";

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    return res.json({
      success: true,
      message: "Status updated successfully",
      data: updated,
    });

  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
