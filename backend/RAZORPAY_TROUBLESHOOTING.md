# Razorpay Troubleshooting Guide

## Common Errors & Solutions

### 1. "RAZORPAY_KEY_ID is undefined"

**Error:**
```
TypeError: Cannot read property 'key_id' of undefined
```

**Causes:**
- `.env` file not created or not in backend directory
- `dotenv.config()` not called before using env variables
- Environment variables not reloaded after changes

**Solutions:**
```javascript
// ✅ Correct: Load env at top of file
import dotenv from "dotenv";
dotenv.config();

// ✅ Verify env variables loaded
console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);
```

**Checklist:**
- [ ] `.env` file exists in `backend/` folder
- [ ] Contains `RAZORPAY_KEY_ID=` and `RAZORPAY_KEY_SECRET=`
- [ ] No spaces around `=`
- [ ] Restart backend server after changing `.env`

---

### 2. "Invalid Signature" Error

**Error:**
```json
{
  "success": false,
  "message": "Payment verification failed - Invalid signature"
}
```

**Causes:**
- Order ID and Payment ID don't match
- Using wrong key secret for verification
- Signature computed incorrectly

**Solutions:**
```javascript
// ❌ Wrong: Order and Payment don't match
const body = "order_1" + "|" + "pay_2"; // Mismatched IDs

// ✅ Correct: Use exact same IDs from payment response
const { razorpay_order_id, razorpay_payment_id } = req.body;
const body = razorpay_order_id + "|" + razorpay_payment_id;

// ✅ Use correct key secret
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // Must be secret, not ID
  .update(body.toString())
  .digest("hex");
```

**Debug Steps:**
1. Log the values being verified:
```javascript
console.log("Order ID:", razorpay_order_id);
console.log("Payment ID:", razorpay_payment_id);
console.log("Signature from frontend:", razorpay_signature);
console.log("Expected signature:", expectedSignature);
```

2. Ensure exact match:
```javascript
if (expectedSignature !== razorpay_signature) {
  console.log("MISMATCH!");
  console.log("Expected:", expectedSignature);
  console.log("Received:", razorpay_signature);
}
```

---

### 3. "Order Not Found" Error

**Error:**
```
Razorpay order not found
```

**Causes:**
- Order ID is incorrect/doesn't exist
- Using test key for production order (or vice versa)
- Order ID copied incorrectly

**Solutions:**
```javascript
// ✅ Verify order exists on Razorpay
try {
  const order = await razorpay.orders.fetch(orderId);
  console.log("Order exists:", order.id);
} catch (error) {
  console.error("Order does not exist:", orderId);
}
```

**Checklist:**
- [ ] Order ID starts with `order_`
- [ ] Using same test/live keys for order creation and verification
- [ ] Order ID is not null/undefined
- [ ] Check Razorpay dashboard for order

---

### 4. CORS Error

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Causes:**
- Backend doesn't have CORS middleware
- CORS origin misconfigured
- Frontend and backend on different origins

**Solutions:**
```javascript
// ✅ Add CORS middleware to backend
import cors from "cors";

const app = express();
app.use(cors()); // Allow all origins (for development)

// ✅ Or configure specific origins
app.use(cors({
  origin: process.env.FRONTEND_URL, // http://localhost:5173
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Checklist:**
- [ ] `cors` package installed: `npm install cors`
- [ ] Middleware added before routes
- [ ] FRONTEND_URL matches actual frontend origin
- [ ] Server restarted after changes

---

### 5. "Cannot find module 'razorpay'"

**Error:**
```
Error: Cannot find module 'razorpay'
```

**Causes:**
- razorpay not installed
- node_modules deleted
- Working directory wrong

**Solutions:**
```bash
# Install from backend directory
cd backend
npm install razorpay

# Verify installation
npm list razorpay
```

**Checklist:**
- [ ] In `backend/` directory before running npm
- [ ] Package.json exists
- [ ] `razorpay` listed in dependencies
- [ ] `node_modules/razorpay` folder exists

---

### 6. Payment Showing in Test Dashboard But Not in App

**Causes:**
- Not verifying payment signature
- Not checking `status` field
- Frontend not handling success response

**Solutions:**
```javascript
// ✅ Always verify signature
const isValid = expectedSignature === razorpay_signature;
if (!isValid) {
  return res.status(400).json({ success: false });
}

// ✅ Check payment status
const payment = await razorpay.payments.fetch(paymentId);
if (payment.status === 'captured' || payment.status === 'authorized') {
  // Payment successful
}

// ✅ Update database/order
await Order.findByIdAndUpdate(orderId, {
  paymentStatus: "completed",
  paymentId: razorpay_payment_id
});
```

---

### 7. "Failed to create order" Error

**Error:**
```json
{
  "success": false,
  "message": "Failed to create order"
}
```

**Causes:**
- Invalid API credentials
- Amount is 0 or negative
- Network issue with Razorpay API
- Test credentials but calling live endpoint

**Solutions:**
```javascript
// ✅ Validate amount
const { amount, currency = "INR" } = req.body;
if (!amount || amount <= 0) {
  return res.status(400).json({
    success: false,
    message: "Amount must be greater than 0"
  });
}

// ✅ Check credentials
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Razorpay credentials not configured");
}

// ✅ Log error details
try {
  const order = await razorpay.orders.create(options);
} catch (error) {
  console.error("Order creation failed:", {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode
  });
}
```

**Debug:**
```javascript
// Test endpoint with simple amount
POST /api/payment/create-order
{
  "amount": 100,
  "currency": "INR"
}
// Should return an order_id
```

---

### 8. "Checksum Failed" Error

**Error:**
```
Razorpay: Razorpay error: Invalid authorization header format
```

**Causes:**
- Key ID in Authorization header is wrong format
- Using secret instead of Key ID in auth header

**Solutions:**
```javascript
// ❌ Wrong: Authorization structure
Authorization: "Bearer secret_key"

// ✅ Correct: Basic auth with Key ID
Authorization: "Basic <base64(key_id:key_secret)>"

// Note: Razorpay Node.js SDK handles this automatically
// Just ensure correct key_id and key_secret
```

---

### 9. Payment Success But Order Not Updated

**Causes:**
- Database update not called
- Async/await not used correctly
- Transaction rolled back

**Solutions:**
```javascript
// ✅ After signature verification
export const verifyPayment = async (req, res) => {
  try {
    // ... signature verification code ...
    
    if (!isSignatureValid) {
      return res.status(400).json({ success: false });
    }

    // ✅ Update order in database
    const order = await Order.findByIdAndUpdate(
      req.body.orderId,
      {
        paymentStatus: "completed",
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        updatedAt: new Date()
      },
      { new: true }
    );

    // ✅ Send confirmation email
    await sendConfirmationEmail(order.userEmail);

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

### 10. Frontend Not Showing Razorpay Checkout

**Causes:**
- Razorpay script not included
- invalid `key` parameter
- Order ID not returned from backend

**Solutions:**
```html
<!-- ✅ Include script before using Razorpay -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

```javascript
// ✅ Correct options
const options = {
  key: process.env.VITE_RAZORPAY_KEY_ID,  // Starts with rzp_test or rzp_live
  order_id: order.id,                      // From backend response
  amount: order.amount,                    // In paise
  currency: "INR",
  name: "Your Store",
  handler: (response) => {
    // Handle success
  },
  prefill: {
    email: "customer@example.com",
    contact: "9876543210"
  }
};

new Razorpay(options).open();
```

---

## Quick Debug Checklist

- [ ] `.env` file exists with correct credentials
- [ ] Backend server running without errors
- [ ] `npm install razorpay` completed
- [ ] CORS enabled in backend
- [ ] Order creation returns valid order ID
- [ ] Signature verification logic is correct
- [ ] Database updates after payment success
- [ ] Email confirmations being sent
- [ ] Frontend has Razorpay script
- [ ] Test cards with test credentials

---

## Getting Help

### Enable Debug Logging
```javascript
// Add to payment controller
const debug = true;

if (debug) {
  console.log("=== Payment Debug ===");
  console.log("Order ID:", razorpay_order_id);
  console.log("Payment ID:", razorpay_payment_id);
  console.log("Signature:", razorpay_signature);
  console.log("Expected Sig:", expectedSignature);
  console.log("Match:", expectedSignature === razorpay_signature);
}
```

### Check Razorpay Dashboard
1. Login: https://dashboard.razorpay.com
2. Toggle "Test mode" if testing
3. View orders and payments
4. Check API keys are correct

### Razorpay Support
- Docs: https://razorpay.com/docs/
- Status: https://status.razorpay.io/
- Support: https://razorpay.com/support/

---

**Have a unique issue?** Check [RAZORPAY_IMPLEMENTATION_CHECKLIST.md](RAZORPAY_IMPLEMENTATION_CHECKLIST.md) for step-by-step verification.
