import mongoose from "mongoose";

const RejectedStaffSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  role: String,
  department: String,
  specialization: String,
  shiftTiming: String,
  idProof: String,
  rejectionReason: { type: String, default: "Not specified" },
  dateRejected: { type: Date, default: Date.now },
});

export default mongoose.model("RejectedStaff", RejectedStaffSchema);
