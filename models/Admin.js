// models/Admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  accessLevel: { type: String, required: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
