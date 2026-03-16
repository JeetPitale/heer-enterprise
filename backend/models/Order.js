import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        userName: { type: String, required: false },
        userEmail: { type: String, required: false },
        orderItems: [
            {
                name: { type: String, required: true },
                qty: { type: Number, required: true },
                image: { type: String, required: false, default: "" },
                price: { type: Number, required: true },
                product: {
                    type: String,  // Changed to String to accept any product ID format
                    required: false,
                },
                size: { type: String },
                color: { type: String },
            },
        ],
        shippingAddress: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: false },
            zipCode: { type: String, required: false },
            state: { type: String, required: false },
            email: { type: String, required: true },
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            razorpay_payment_id: { type: String },
            razorpay_order_id: { type: String },
            razorpay_signature: { type: String },
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        status: {
            type: String,
            required: true,
            default: "Processing",
            enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
        },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
