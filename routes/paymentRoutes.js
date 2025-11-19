import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

// Razorpay Keys (Test Keys)
const RAZORPAY_KEY_ID = "rzp_test_RfalM2W39n2rA4";
const RAZORPAY_KEY_SECRET = "S57SFwf0dCVt0repdVl1SPJq";

// Initialize Razorpay
let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay Initialized Successfully");
} else {
  console.error("❌ Razorpay Keys Missing");
}

// Create Order API
router.post("/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Payment service unavailable",
      });
    }

    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least ₹1",
      });
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Razorpay Order Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
});

// Verify Payment API
router.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (razorpay_signature === expectedSignature) {
      return res.json({
        success: true,
        message: "Payment Verified Successfully",
        payment_id: razorpay_payment_id,   // ✅ REQUIRED FIX
      });
    }

    return res.status(400).json({
      success: false,
      message: "Payment Verification Failed",
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification error",
    });
  }
});

export default router;
