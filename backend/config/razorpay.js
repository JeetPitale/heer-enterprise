import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Check if in mock mode (manual override)
export const isMockMode = () => {
  return process.env.RAZORPAY_MODE === "mock";
};

export default razorpay;
