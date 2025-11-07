import mongoose from "mongoose";

const pendingStaffSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String },
  specialty: { type: String },
  shiftTiming: { type: String },
  password: { type: String, required: true },
  uploadId: { type: String }, // stores uploaded ID path
  status: { type: String, default: "pending" },
});

export default mongoose.model("PendingStaff", pendingStaffSchema, "pending_staff");
