import mongoose from "mongoose";

const AcceptedStaffSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  role: String,
  department: String,
  specialization: String,
  shiftTiming: String,
  idProof: String,
  dateAccepted: { type: Date, default: Date.now },
});

export default mongoose.model("AcceptedStaff", AcceptedStaffSchema);
