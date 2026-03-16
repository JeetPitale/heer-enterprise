import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import razorpay, { isMockMode } from "../config/razorpay.js";

dotenv.config();

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Public
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // MOCK PAYMENT MODE
    if (isMockMode()) {
      console.log("⚠️ Using Mock Payment Mode for Order Creation");
      return res.json({
        id: `order_mock_${Date.now()}`,
        entity: "order",
        amount: amount * 100, // Convert to paise
        amount_paid: 0,
        amount_due: amount * 100,
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        offer_id: null,
        status: "created",
        attempts: 0,
        notes: notes,
        created_at: Math.floor(Date.now() / 1000),
      });
    }

    // Real Razorpay Order
    const options = {
      amount: Math.round(Number(amount) * 100), // Amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res
      .status(500)
      .json({
        message: "Failed to create order",
        error: error.message,
      });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Public
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    let isAuthentic = false;

    // MOCK PAYMENT VERIFICATION
    if (isMockMode()) {
      // In mock mode, accept any signature
      isAuthentic = true;
      console.log("⚠️ Mock Payment Verification Successful");
    } else {
      // Real payment verification
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      res.json({
        success: true,
        message: "Payment verified successfully",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
};

// @desc    Get Payment Details
// @route   GET /api/payment/:paymentId
// @access  Public
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // MOCK MODE
    if (isMockMode()) {
      return res.json({
        id: paymentId,
        entity: "payment",
        amount: 10000,
        currency: "INR",
        status: "captured",
        method: "card",
        description: "Mock Payment",
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        description: "Mock payment for testing",
        card_id: null,
        bank: null,
        wallet: null,
        vpa: null,
        email: "test@example.com",
        contact: "+919999999999",
        notes: {},
        fee: 295,
        tax: 45,
        error_code: null,
        error_description: null,
        error_source: null,
        error_reason: null,
        error_step: null,
        error_field: null,
        created_at: Math.floor(Date.now() / 1000),
      });
    }

    // Real payment fetch
    const payment = await razorpay.payments.fetch(paymentId);
    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

// @desc    Refund Payment
// @route   POST /api/payment/refund
// @access  Public
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, notes = {} } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    // MOCK MODE
    if (isMockMode()) {
      console.log("⚠️ Mock Refund Processed");
      return res.json({
        id: `refund_mock_${Date.now()}`,
        entity: "refund",
        payment_id: paymentId,
        amount: amount * 100,
        currency: "INR",
        notes: notes,
        receipt: null,
        status: "processed",
        speed_processed: "normal",
        batch_id: null,
        created_at: Math.floor(Date.now() / 1000),
      });
    }

    // Real refund
    const options = {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes: notes,
    };

    // Remove undefined values
    Object.keys(options).forEach(
      (key) => options[key] === undefined && delete options[key]
    );

    const refund = await razorpay.payments.refund(paymentId, options);
    res.json({
      message: "Refund processed successfully",
      refund: refund,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({
      message: "Refund failed",
      error: error.message,
    });
  }
};
