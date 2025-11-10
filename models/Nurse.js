import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const nurseSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  shiftTiming: { type: String, required: true }, // e.g. "Morning", "Night"
  uploadId: { type: String, required: true }, // Uploaded ID proof
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});
nurseSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧩 Compare entered password with hashed one
nurseSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Nurse", nurseSchema, "nurses");