# Razorpay Quick Test Guide

## 1. Test Environment Setup

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- Test API keys configured in `.env`

## 2. Test Order Creation

### Using cURL
```bash
curl -X POST http://localhost:5000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "INR",
    "receipt": "test_receipt_001",
    "notes": {
      "user_id": "123",
      "product": "Lipstick"
    }
  }'
```

### Expected Response
```json
{
  "id": "order_1234567890abcde",
  "entity": "order",
  "amount": 500000,
  "amount_paid": 0,
  "amount_due": 500000,
  "currency": "INR",
  "receipt": "test_receipt_001",
  "status": "created",
  "attempts": 0,
  "notes": {
    "user_id": "123",
    "product": "Lipstick"
  },
  "created_at": 1234567890
}
```

## 3. Test Payment Verification

### Save Order ID from Step 2
```bash
ORDER_ID="order_1234567890abcde"  # From response above
PAYMENT_ID="pay_test_xxxxx"       # From Razorpay payment
SIGNATURE="signature_xxxxx"       # From Razorpay payment
```

### Verify Payment
```bash
curl -X POST http://localhost:5000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "'$ORDER_ID'",
    "razorpay_payment_id": "'$PAYMENT_ID'",
    "razorpay_signature": "'$SIGNATURE'"
  }'
```

## 4. Test Cards (Test Mode Only)

| Type | Card Number | CVV | Expiry |
|------|-------------|-----|--------|
| Success | 4111 1111 1111 1111 | 123 | 12/25 |
| Failure | 4444 4444 4444 4448 | 123 | 12/25 |
| 3D Secure | 4012 8888 8888 1881 | 123 | 12/25 |

## 5. Frontend Payment Test

### Step 1: Create HTML Test Page
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <button onclick="initiatePayment()">Pay ₹500</button>
  
  <script>
    async function initiatePayment() {
      // Step 1: Create order
      const orderResponse = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000,
          currency: 'INR'
        })
      });
      
      const order = await orderResponse.json();
      
      // Step 2: Open checkout
      const options = {
        key: "rzp_test_xxxxx", // Your test key
        order_id: order.id,
        handler: async (response) => {
          // Step 3: Verify payment
          const verifyResponse = await fetch('http://localhost:5000/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
          });
          
          const result = await verifyResponse.json();
          alert(result.success ? 'Payment Success!' : 'Payment Failed');
        },
        theme: {
          color: "#3399cc"
        }
      };
      
      const razorpay = new Razorpay(options);
      razorpay.open();
    }
  </script>
</body>
</html>
```

## 6. Debug Checklist

- [ ] Backend server running
- [ ] Environment variables loaded correctly
- [ ] Razorpay KEY_ID and KEY_SECRET not undefined
- [ ] CORS enabled in backend
- [ ] Frontend has Razorpay script included
- [ ] Using test credentials (rzp_test_xxx)
- [ ] Payment signature verification working

## 7. Common Test Scenarios

### Scenario 1: Complete Payment Flow
1. Click "Pay" button
2. Select test card "4111 1111 1111 1111"
3. Enter any CVV (123) and expiry (12/25)
4. Payment should succeed

### Scenario 2: Failed Payment
1. Use card "4444 4444 4444 4448"
2. Payment will fail
3. Check error handling on frontend

### Scenario 3: Verify Order Status
```bash
curl http://localhost:5000/api/order/order_xxxxx
```

## 8. Response Format

### Success Response
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "order_xxxxx",
    "paymentId": "pay_xxxxx",
    "verified": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid signature",
  "error": "Signature verification failed"
}
```

## 9. Debugging Tips

### Check Backend Logs
```bash
# Look for these messages:
# ✅ Payment verified successfully
# ❌ Payment verification failed
# 🔄 Order created successfully
```

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Click Pay button
4. Check for successful POST requests to `/api/payment/`

### Verify Razorpay Dashboard
1. Go to https://dashboard.razorpay.com
2. Check Test mode (toggle at top)
3. Verify orders are created in Orders section

## 10. Moving to Production

When ready for real payments:
1. Get live API keys from Razorpay
2. Update `.env`: Use `rzp_live_xxxxx`
3. Test with small amount first
4. Enable webhook verification
5. Set up email confirmations

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Order not created | Check backend logs, verify API keys |
| Signature invalid | Verify order_id matches payment_id |
| Payment not showing in Razorpay | Check test mode is enabled in dashboard |
| CORS error | Ensure backend has CORS middleware |

---

**Next Steps:**
- Full implementation: [RAZORPAY_BACKEND_EXAMPLE.js](RAZORPAY_BACKEND_EXAMPLE.js)
- Troubleshooting: [RAZORPAY_TROUBLESHOOTING.md](RAZORPAY_TROUBLESHOOTING.md)
