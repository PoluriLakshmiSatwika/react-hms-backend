import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  remainingSlots: {
    type: Number,
  },
});

export default mongoose.model("Payment", paymentSchema);
