// models/Assignment.js

import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",  // ✅ matches your Patient model
    required: true,
  },
  date: String,
  time: String,
  assignedNurses: [
    {
      nurseId: String,
      nurseName: String,
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model("Assignment", AssignmentSchema);
