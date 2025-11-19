// Appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  disease: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  slotTime: { type: String, required: true },

  // STORE ONLY NURSE IDs → POPULATE WILL WORK
  assignedNurses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nurse",
    }
  ],

  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
    default: "Pending",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Appointment", appointmentSchema);
