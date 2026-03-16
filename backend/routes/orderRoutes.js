import express from "express";
import { createOrder, verifyPayment, getOrderById, getMyOrders, getOrders, updateOrderStatus } from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createOrder);
router.post("/verify", verifyPayment);
router.get("/myorders", protect, getMyOrders);
router.get("/", protect, admin, getOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);
router.get("/:id", getOrderById);

export default router;
