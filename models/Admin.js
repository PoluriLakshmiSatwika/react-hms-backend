import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  accessLevel: { type: String, required: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧩 Compare entered password with hashed one
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema, "admins");
export default Admin;
