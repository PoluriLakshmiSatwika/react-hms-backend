import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const nurseSchema = new mongoose.Schema({
  fullName: { type: String, required: true },

  email: { 
    type: String, 
    required: true, 
    unique: true,            // 🔥 prevent duplicates
    lowercase: true,         // 🔥 normalizes email
    trim: true 
  },

  phone: { type: String, required: true },
  department: { type: String, required: true },
  shiftTiming: { type: String, required: true },
  uploadId: { type: String, required: true },
  password: { type: String, required: true },

  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

// 🔐 Hash password before saving
nurseSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔍 Compare password
nurseSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Nurse", nurseSchema, "nurses");
