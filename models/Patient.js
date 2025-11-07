import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: String, required: true }, // Format: YYYY-MM-DD
  bloodGroup: { type: String, required: true },
  medicalHistory: { type: String }, // Example: "Diabetes, High BP"
  password: { type: String, required: true },
});

export default mongoose.model("Patient", patientSchema, "patients");