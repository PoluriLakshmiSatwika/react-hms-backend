import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  staffId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["Doctor", "Nurse"], required: true },
  department: { type: String },
  specialty: { type: String },
  shift: { type: String },
});

export default mongoose.model("Staff", staffSchema);
