import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});
pendingStaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧩 Compare entered password with hashed one
pendingStaffSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
export default mongoose.model("PendingStaff", pendingStaffSchema, "pending_staff");
