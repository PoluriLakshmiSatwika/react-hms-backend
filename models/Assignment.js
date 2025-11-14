import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String, // Change from Number → String
    required: true,
  },
  patientName: String,
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
