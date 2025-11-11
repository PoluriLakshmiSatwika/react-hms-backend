import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const doctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  specialty: { type: String, required: true }, // Previously "specialization"
  department: { type: String, required: true },
  uploadId: { type: String, required: true }, // File ID / Document reference
  password: { type: String, required: true },
  slots: {
  type: [String],
  default: ["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM"] // Add default slots
}

});

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧩 Compare entered password with hashed one
doctorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
export default mongoose.model("Doctor", doctorSchema, "doctors");