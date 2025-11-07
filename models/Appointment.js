import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  date: { type: Date, default: Date.now },
  message: { type: String, default: "Booked successfully" } // add message field
});

export default mongoose.model("Appointment", appointmentSchema, "appointment"); // explicitly use 'appointment' collection
