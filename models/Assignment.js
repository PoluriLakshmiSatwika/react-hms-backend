import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: "Nurse", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  appointmentDate: { type: Date, required: true },
  slotTime: { type: String, required: true },
  disease: { type: String, required: true },
});

export default mongoose.model("Assignment", AssignmentSchema);
