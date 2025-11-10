import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const AcceptedStaffSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  role: String,
  department: String,
  specialization: String,
  shiftTiming: String,
  idProof: String,
  dateAccepted: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

});
AcceptedStaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧩 Compare entered password with hashed one
AcceptedStaffSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("AcceptedStaff", AcceptedStaffSchema);
