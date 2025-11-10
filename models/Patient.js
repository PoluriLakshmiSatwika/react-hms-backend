import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const patientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: String, required: true }, // Format: YYYY-MM-DD
  bloodGroup: { type: String, required: true },
  medicalHistory: { type: String }, // Example: "Diabetes, High BP"
  password: { type: String, required: true },
});
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧩 Compare entered password with hashed one
patientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Patient", patientSchema, "patients");