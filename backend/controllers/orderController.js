import Order from "../models/Order.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { sendOrderConfirmationEmail } from "../utils/mailer.js";
import { isMockMode } from "../config/razorpay.js";


dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", receipt } = req.body;

        const options = {
            amount: Math.round(Number(amount) * 100), // Amount in paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        console.log("📝 Creating Razorpay order with options:", options);
        const order = await razorpay.orders.create(options);
        console.log("✅ Order created successfully:", order.id);
        res.json(order);
    } catch (error) {
        console.error("❌ Order Creation Error:", error.message);
        console.error("Full Error:", error);
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};

// @desc    Verify Payment
// @route   POST /api/orders/verify
// @access  Public
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderItems,
            shippingAddress,
            totalPrice,
            user,
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id) {
            console.error("❌ Missing payment details:", { razorpay_order_id, razorpay_payment_id });
            return res.status(400).json({ message: "Missing payment details" });
        }

        let isAuthentic = false;

        // MOCK PAYMENT VERIFICATION
        if (isMockMode() || razorpay_order_id.startsWith("order_mock_") || razorpay_payment_id?.startsWith("mock_payment")) {
            // In mock mode or if order/payment is mock, bypass signature verification
            isAuthentic = true;
            console.log("✅ Mock Payment Verified");
        } else {
            // Production mode - verify signature
            console.log("🔒 Production Mode - Verifying Signature");
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            isAuthentic = expectedSignature === razorpay_signature;
            console.log("Signature Expected:", expectedSignature.substring(0, 10) + "...");
            console.log("Signature Received:", razorpay_signature?.substring(0, 10) + "...");
            console.log("Signature Match:", isAuthentic);
        }

        if (isAuthentic) {
            console.log("Creating order in database...");

            // Check if user._id is a valid ObjectId, otherwise set to null
            let userId = null;
            if (user && user._id && mongoose.Types.ObjectId.isValid(user._id)) {
                userId = user._id;
            } else if (user && user.id && mongoose.Types.ObjectId.isValid(user.id)) {
                userId = user.id;
            }

            const orderData = {
                user: userId,
                userName: user?.name || (shippingAddress ? `${shippingAddress.firstName} ${shippingAddress.lastName}` : 'Guest'),
                userEmail: user?.email || shippingAddress?.email,
                orderItems,
                shippingAddress,
                paymentResult: {
                    id: razorpay_payment_id,
                    status: "Paid",
                    update_time: new Date().toISOString(),
                    razorpay_payment_id,
                    razorpay_order_id,
                    razorpay_signature,
                },
                totalPrice,
                isPaid: true,
                paidAt: Date.now(),
                status: "Processing",
            };

            console.log("📦 Order Data to Save:", {
                userId: orderData.user,
                name: orderData.userName,
                email: orderData.userEmail,
                total: orderData.totalPrice
            });

            const order = new Order(orderData);

            try {
                const createdOrder = await order.save();
                console.log("✅ Order saved successfully:", createdOrder._id);

                // Send order confirmation email
                if (user && user.email) {
                    try {
                        await sendOrderConfirmationEmail(
                            user.name || "Customer",
                            user.email,
                            createdOrder._id,
                            orderItems,
                            totalPrice
                        );
                    } catch (emailError) {
                        console.warn("⚠️ Email failed:", emailError.message);
                    }
                }

                return res.status(201).json({
                    success: true,
                    message: "Payment Verified",
                    orderId: createdOrder._id,
                    paid: true
                });
            } catch (saveError) {
                console.error("❌ Database Save Error:", saveError.message);
                console.error("❌ Full Error:", saveError);
                if (saveError.errors) {
                    console.error("Validation Errors:", Object.keys(saveError.errors).map(key => `${key}: ${saveError.errors[key].message}`));
                }
                return res.status(500).json({
                    success: false,
                    message: "Failed to save order to database",
                    error: saveError.message,
                    validationErrors: saveError.errors ? Object.keys(saveError.errors).map(key => ({
                        field: key,
                        message: saveError.errors[key].message
                    })) : [],
                    orderData: orderData // Send back the data to debug
                });
            }
        } else {
            console.error("❌ Payment verification failed - Invalid signature");
            return res.status(400).json({ success: false, message: "Payment verification failed - Invalid signature" });
        }
    } catch (error) {
        console.error("❌ System Error during verification:", error.message);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: "Internal Server Error during verification",
            error: error.message
        });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email");

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate("user", "name email").sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = req.body.status;
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
