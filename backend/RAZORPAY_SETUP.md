# Razorpay Setup Guide

## 1. Prerequisites
- Node.js 14+ installed
- npm or yarn package manager
- Razorpay account (https://razorpay.com)

## 2. Installation Steps

### Step 1: Install Razorpay Package
```bash
npm install razorpay
```

### Step 2: Get Your Credentials
1. Login to your Razorpay Dashboard: https://dashboard.razorpay.com
2. Navigate to **Settings** → **API Keys**
3. Copy your:
   - **Key ID** (starts with `rzp_live_` or `rzp_test_`)
   - **Key Secret** (keep this confidential!)

### Step 3: Configure Environment Variables

Create/update `.env` file in the backend directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret

# Email Configuration
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 4: Initialize Razorpay in Your Backend

The Razorpay client is already initialized in:
```
backend/config/razorpay.js
```

### Step 5: Configure Routes

Payment routes are configured in:
```
backend/routes/paymentRoutes.js
```

## 3. API Endpoints

### Create Order
**POST** `/api/payment/create-order`

Request body:
```json
{
  "amount": 1000,
  "currency": "INR",
  "receipt": "receipt_001",
  "notes": {
    "user_id": "123",
    "product_name": "Lipstick"
  }
}
```

### Verify Payment
**POST** `/api/payment/verify`

Request body:
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

## 4. Testing with Mock Credentials

For development/testing without real payments:

```env
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=test_secret_placeholder
```

The system will use mock payment mode automatically.

## 5. Security Best Practices

✅ **Do:**
- Keep `RAZORPAY_KEY_SECRET` private
- Verify payment signatures on the backend
- Hash sensitive user data
- Use HTTPS in production

❌ **Don't:**
- Expose key secret in frontend code
- Commit `.env` to version control
- Trust client-side payment verification
- Log sensitive payment details

## 6. Testing Checklist

- [ ] Install razorpay package
- [ ] Add environment variables to `.env`
- [ ] Initialize Razorpay client
- [ ] Test order creation endpoint
- [ ] Test payment verification endpoint
- [ ] Handle payment success/failure in frontend
- [ ] Update order status in database
- [ ] Send confirmation email to user

## 7. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `RAZORPAY_KEY_ID undefined` | Check `.env` file configuration |
| `Invalid signature` | Verify order ID and payment ID match |
| `Order not found` | Check Razorpay dashboard for order status |
| `CORS error` | Enable CORS in backend server |

## 8. Next Steps

1. Review [RAZORPAY_QUICKSTART.md](RAZORPAY_QUICKSTART.md) for quick implementation
2. Check [RAZORPAY_BACKEND_EXAMPLE.js](RAZORPAY_BACKEND_EXAMPLE.js) for code examples
3. Use [RAZORPAY_QUICK_TEST.md](RAZORPAY_QUICK_TEST.md) to test payment flow
