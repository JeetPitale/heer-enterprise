/**
 * Complete Razorpay Integration Example
 * This file demonstrates all payment operations
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ============================================
// 1. Initialize Razorpay
// ============================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================
// 2. Create Order
// ============================================

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, customer_details = {} } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Create order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        customer_email: customer_details.email,
        customer_phone: customer_details.phone,
        custom_field: customer_details.custom_field || null,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// ============================================
// 3. Verify Payment Signature
// ============================================

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details",
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    // At this point, payment is verified
    console.log("✅ Payment verified successfully");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);

    // Save payment to database here
    // const payment = await PaymentModel.create({
    //   razorpay_order_id,
    //   razorpay_payment_id,
    //   razorpay_signature,
    //   status: "completed",
    // });

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        verified: true,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

// ============================================
// 4. Get Payment Details
// ============================================

export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at,
      },
    });
  } catch (error) {
    console.error("Fetch payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

// ============================================
// 5. Refund Payment
// ============================================

export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, notes = {} } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const refundOptions = {
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      notes: notes,
    };

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    res.json({
      success: true,
      message: "Refund initiated successfully",
      data: {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
        created_at: refund.created_at,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message,
    });
  }
};

// ============================================
// 6. Get Order Details
// ============================================

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await razorpay.orders.fetch(orderId);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
        attempts: order.attempts,
        created_at: order.created_at,
      },
    });
  } catch (error) {
    console.error("Fetch order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};

// ============================================
// 7. Route Setup
// ============================================

app.post("/api/payment/create-order", createOrder);
app.post("/api/payment/verify", verifyPayment);
app.get("/api/payment/:paymentId", getPaymentDetails);
app.post("/api/payment/refund", refundPayment);
app.get("/api/order/:orderId", getOrderDetails);

// ============================================
// 8. Error Handler Middleware
// ============================================

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================
// 9. Start Server
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💳 Razorpay Payment Gateway Ready`);
});

export { razorpay };
