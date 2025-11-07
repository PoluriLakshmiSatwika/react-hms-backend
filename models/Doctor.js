import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  specialty: { type: String }, // Previously "specialization"
  department: { type: String, required: true },
  uploadId: { type: String, required: true }, // File ID / Document reference
  password: { type: String, required: true },
});

export default mongoose.model("Doctor", doctorSchema, "doctors");