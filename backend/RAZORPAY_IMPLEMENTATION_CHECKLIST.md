# Razorpay Implementation Checklist

## Phase 1: Setup & Configuration ✅

- [ ] Create Razorpay account at https://razorpay.com
- [ ] Get API credentials (Key ID & Key Secret)
- [ ] Create `.env` file in backend directory
- [ ] Add Razorpay credentials to `.env`:
  ```env
  RAZORPAY_KEY_ID=your_key_id
  RAZORPAY_KEY_SECRET=your_key_secret
  ```
- [ ] Install Razorpay package: `npm install razorpay`
- [ ] Verify installation: `npm list razorpay`

## Phase 2: Backend Setup ✅

### Configuration File
- [ ] Create `backend/config/razorpay.js`
- [ ] Initialize Razorpay client
- [ ] Test credentials loading:
  ```javascript
  console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID);
  ```

### Payment Controller
- [ ] Create `backend/controllers/paymentController.js`
- [ ] Implement `createOrder()` function
- [ ] Implement `verifyPayment()` function
- [ ] Implement `getOrderDetails()` function
- [ ] Implement `getPaymentDetails()` function
- [ ] Implement `refundPayment()` function (optional)

### Validation
- [ ] Validate amount > 0
- [ ] Validate currency
- [ ] Validate receipt availability
- [ ] Handle missing parameters

### Error Handling
- [ ] Catch Razorpay API errors
- [ ] Return meaningful error messages
- [ ] Log errors for debugging
- [ ] Don't expose sensitive info in error responses

### Signature Verification
- [ ] Import crypto module
- [ ] Implement HMAC-SHA256 verification
- [ ] Verify order_id | payment_id with secret
- [ ] Compare computed vs received signature
- [ ] Return 400 for invalid signatures

## Phase 3: Routes Setup ✅

- [ ] Create `backend/routes/paymentRoutes.js`
- [ ] POST `/api/payment/create-order` → createOrder
- [ ] POST `/api/payment/verify` → verifyPayment
- [ ] GET `/api/payment/:paymentId` → getPaymentDetails
- [ ] GET `/api/order/:orderId` → getOrderDetails
- [ ] POST `/api/payment/refund` → refundPayment (optional)

## Phase 4: Database Integration ✅

### Payment Model
- [ ] Create `backend/models/Payment.js` (if not exists)
- [ ] Fields needed:
  ```javascript
  {
    user_id,
    order_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    currency,
    status,
    payment_method,
    created_at,
    updated_at
  }
  ```

### Order Model
- [ ] Update `backend/models/Order.js`
- [ ] Add payment-related fields:
  - `paymentStatus` (pending/completed/failed)
  - `razorpayOrderId`
  - `razorpayPaymentId`

### Database Operations
- [ ] Save order to DB on create
- [ ] Update order on payment success
- [ ] Handle failed payments
- [ ] Keep payment transaction record

## Phase 5: Middleware & Security ✅

### CORS Setup
- [ ] Enable CORS in backend
  ```javascript
  import cors from "cors";
  app.use(cors());
  ```
- [ ] Configure allowed origins for production

### Authentication
- [ ] Protect payment endpoints with auth middleware
- [ ] Verify user is authenticated before payment
- [ ] Validate user owns the order

### Rate Limiting (Optional)
- [ ] Implement rate limiting on payment endpoints
- [ ] Prevent brute force attempts

### Logging
- [ ] Log all payment attempts
- [ ] Log signature verifications
- [ ] Log database updates
- [ ] Use structured logging

## Phase 6: Frontend Integration ✅

### Setup
- [ ] Include Razorpay script in HTML:
  ```html
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  ```
- [ ] Add Razorpay Key ID to frontend `.env`:
  ```env
  VITE_RAZORPAY_KEY_ID=your_test_key
  ```

### Checkout Page
- [ ] Create payment button in checkout
- [ ] Call backend to create order
- [ ] Open Razorpay checkout modal
- [ ] Handle payment response
- [ ] Verify payment on backend

### Payment Handler
```javascript
const options = {
  key: process.env.VITE_RAZORPAY_KEY_ID,
  order_id: order.id,
  handler: async (response) => {
    // Send to backend for verification
  }
};
```

### Success/Failure Handling
- [ ] Success page with order confirmation
- [ ] Failure page with retry option
- [ ] Update cart status
- [ ] Send confirmation email

## Phase 7: Testing ✅

### Unit Tests
- [ ] Test order creation with valid amount
- [ ] Test order creation with invalid amount
- [ ] Test signature verification (valid)
- [ ] Test signature verification (invalid)
- [ ] Test order fetch
- [ ] Test payment fetch

### Integration Tests
- [ ] Create order → Capture payment → Verify
- [ ] User registration → Purchase → Payment
- [ ] Multiple orders from same user
- [ ] Partial payments/refunds

### Manual Testing
- [ ] Test with test card: 4111 1111 1111 1111
- [ ] Test with failure card: 4444 4444 4444 4448
- [ ] Test with 3D Secure: 4012 8888 8888 1881
- [ ] Check Razorpay dashboard for orders
- [ ] Verify database records created

### Edge Cases
- [ ] Empty order ID
- [ ] Negative amount
- [ ] Invalid signature
- [ ] Duplicate payment attempts
- [ ] Refund after timeout

## Phase 8: Email Notifications ✅

- [ ] Setup email service (Nodemailer)
- [ ] Send confirmation email on:
  - [ ] Order created
  - [ ] Payment successful
  - [ ] Payment failed
  - [ ] Order dispatched
  - [ ] Order delivered

- [ ] Email template includes:
  - [ ] Order ID
  - [ ] Payment amount
  - [ ] Order tracking link
  - [ ] Customer support contact

## Phase 9: Notifications & Webhooks (Advanced) ✅

### Webhooks (Optional but Recommended)
- [ ] Implement webhook endpoint: `/api/payment/webhook`
- [ ] Verify webhook signature
- [ ] Handle payment events:
  - [ ] payment.authorized
  - [ ] payment.captured
  - [ ] payment.failed
  - [ ] refund.created
- [ ] Update order status from webhook
- [ ] Retry logic for webhook failures
- [ ] Store webhook logs

### SMS Notifications (Optional)
- [ ] Send SMS on payment success
- [ ] Send SMS on order shipment
- [ ] Include order tracking link

## Phase 10: Security Audit ✅

- [ ] HTTPS enforced in production
- [ ] API keys not exposed in frontend code
- [ ] Signature verification always done server-side
- [ ] Input validation on all endpoints
- [ ] Output sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting enabled
- [ ] Logging sensitive operations
- [ ] Error messages don't leak system details

## Phase 11: Monitoring & Logging ✅

- [ ] Payment success rate tracking
- [ ] Failed payment analysis
- [ ] Response time monitoring
- [ ] Error rate tracking
- [ ] Database query logs
- [ ] API call logs
- [ ] Alerting on failures

## Phase 12: Production Deployment ✅

### Pre-Deployment
- [ ] Switch to live Razorpay credentials
- [ ] Update RAZORPAY_KEY_ID in production `.env`
- [ ] Update RAZORPAY_KEY_SECRET in production `.env`
- [ ] Setup SSL certificate (HTTPS)
- [ ] Configure database backups
- [ ] Enable monitoring/logging

### Deployment Steps
- [ ] Test with small transactions first
- [ ] Monitor for errors
- [ ] Have rollback plan ready
- [ ] Notify customer support team
- [ ] Update documentation

### Post-Deployment
- [ ] Monitor all metrics
- [ ] Check for errors in logs
- [ ] Verify email confirmations sending
- [ ] Test full payment flow
- [ ] Training for support team

## Phase 13: Documentation ✅

- [ ] README with setup instructions
- [ ] API documentation
- [ ] Testing guide
- [ ] Troubleshooting guide
- [ ] Code comments
- [ ] Database schema documentation

## Phase 14: Maintenance ✅

### Regular Checks
- [ ] Weekly: Review failed payments
- [ ] Monthly: Check reconciliation reports
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Quarterly: Performance review

### Updates
- [ ] Monitor Razorpay API updates
- [ ] Update Razorpay package regularly
- [ ] Security patches
- [ ] Bug fixes

## Phase 15: Optional Enhancements

- [ ] Subscription payments
- [ ] Installment plans
- [ ] Multiple payment methods (Apple Pay, Google Pay)
- [ ] Dispute handling
- [ ] Chargeback management
- [ ] Analytics dashboard
- [ ] Invoice generation

---

## Status Summary

- **Setup**: ⬜ Not Started | 🟨 In Progress | ✅ Complete
- **Backend**: ⬜ Not Started | 🟨 In Progress | ✅ Complete
- **Frontend**: ⬜ Not Started | 🟨 In Progress | ✅ Complete
- **Testing**: ⬜ Not Started | 🟨 In Progress | ✅ Complete
- **Production**: ⬜ Not Started | 🟨 In Progress | ✅ Complete

---

## Signature

- **Implementation Date**: _______________
- **Implemented By**: _______________
- **Tested By**: _______________
- **Approved By**: _______________

---

## Contact & Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Support**: https://razorpay.com/support/
- **Dashboard**: https://dashboard.razorpay.com/
