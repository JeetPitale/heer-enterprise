# Razorpay Quick Start Guide

## Quick Setup (5 minutes)

### Step 1: Add Environment Variables
```env
RAZORPAY_KEY_ID=rzp_test_xxx...
RAZORPAY_KEY_SECRET=xxx...
FRONTEND_URL=http://localhost:5173
```

### Step 2: Backend Configuration
```javascript
// config/razorpay.js
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
```

### Step 3: Create Payment Order
```javascript
// In your payment controller
const order = await razorpay.orders.create({
  amount: 50000, // ₹500 in paise
  currency: "INR",
  receipt: "receipt_001",
});
```

### Step 4: Verify Payment Signature
```javascript
import crypto from "crypto";

const body = razorpay_order_id + "|" + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(body.toString())
  .digest("hex");

const isValid = expectedSignature === razorpay_signature;
```

### Step 5: Frontend Integration
```javascript
// Frontend code
const handlePayment = async () => {
  // 1. Create order from backend
  const response = await fetch("/api/payment/create-order", {
    method: "POST",
    body: JSON.stringify({ amount: 50000, currency: "INR" }),
  });
  const order = await response.json();

  // 2. Open Razorpay checkout
  const options = {
    key: process.env.VITE_RAZORPAY_KEY_ID, // Frontend key
    order_id: order.id,
    handler: async (response) => {
      // 3. Verify payment on backend
      await fetch("/api/payment/verify", {
        method: "POST",
        body: JSON.stringify(response),
      });
    },
  };
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

### Step 6: Include Razorpay Script
```html
<!-- In index.html or layout -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Common Amounts for Testing

| Item | Paise | INR |
|------|-------|-----|
| Product | 50000 | ₹500 |
| Accessory | 10000 | ₹100 |
| Service | 5000 | ₹50 |

## Quick Test Cards (Test Mode Only)

| Card | Number | CVV | Date |
|------|--------|-----|------|
| Visa | 4111 1111 1111 1111 | 123 | 12/25 |
| Mastercard | 5555 5555 5555 4444 | 123 | 12/25 |

---

**⚠️ Note:** Use above cards ONLY in test mode. Never use them in production.

---

## Troubleshooting Quick Fixes

```javascript
// Error: Invalid signature
// → Verify order_id and payment_id match exactly

// Error: RAZORPAY_KEY_ID undefined
// → Check .env file is loaded: dotenv.config()

// Error: Order not found
// → Check Razorpay dashboard for order creation status

// Error: CORS error
// → Enable CORS in backend: app.use(cors())
```

## Next Steps
- See [RAZORPAY_BACKEND_EXAMPLE.js](RAZORPAY_BACKEND_EXAMPLE.js) for complete code
- Test with [RAZORPAY_QUICK_TEST.md](RAZORPAY_QUICK_TEST.md)
- Troubleshoot with [RAZORPAY_TROUBLESHOOTING.md](RAZORPAY_TROUBLESHOOTING.md)
