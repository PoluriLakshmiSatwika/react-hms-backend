// models/Assignment.js
import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: "Nurse" },
  patientName: { type: String },
  time: { type: String },
  appointmentDate: { type: Date },
  room: { type: String },
  location: { type: String },
  status: { type: String, enum: ["pending", "accepted", "completed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Assignment", assignmentSchema);
// import mongoose from "mongoose";

// const AssignmentSchema = new mongoose.Schema({
//   appointmentId: {
//     type: String,
//     required: true,
//   },
//   patientId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Patient",  // ✅ matches your Patient model
//     required: true,
//   },
//   date: String,
//   time: String,
//   assignedNurses: [
//     {
//       nurseId: String,
//       nurseName: String,
//     }
//   ],
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   }
// });

// export default mongoose.model("Assignment", AssignmentSchema);
