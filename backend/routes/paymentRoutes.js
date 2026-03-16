import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentDetails,
  refundPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// Create order
router.post("/create-order", createRazorpayOrder);

// Verify payment
router.post("/verify", verifyRazorpayPayment);

// Get payment details
router.get("/:paymentId", getPaymentDetails);

// Process refund
router.post("/refund", refundPayment);

export default router;
