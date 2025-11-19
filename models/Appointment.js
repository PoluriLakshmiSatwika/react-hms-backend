import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  disease: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  slotTime: { type: String, required: true },
  feePaid: { type: Boolean, default: false },

  // ✅ FIX: Razorpay paymentId must be STRING, not ObjectId
  paymentId: { type: String },

  validityCount: { type: Number, default: 3 },

  assignedNurses: [
    {
      nurseId: { type: mongoose.Schema.Types.ObjectId, ref: "Nurse", required: true },
      nurseName: { type: String, required: true }
    }
  ],

  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
    default: "Pending"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Appointment", appointmentSchema);
