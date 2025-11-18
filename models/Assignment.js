import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  date: String,
  time: String,
  assignedNurses: [
    {
      nurseId: String,
      nurseName: String,
      status: {
        type: String,
        enum: ["Pending", "Accepted", "Completed"],
        default: "Pending",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Assignment", AssignmentSchema);


