# Razorpay Visual Guide & Architecture

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       PAYMENT SYSTEM ARCHITECTURE               │
└─────────────────────────────────────────────────────────────────┘

                         FRONTEND (React/Vue)
                               │
                    ┌──────────┴──────────┐
                    │                     │
              Checkout Page          Payment Modal
                    │                     │
                    └──────────┬──────────┘
                               ↓
                    ┌──────────────────────┐
                    │  Razorpay SDK (.js)  │
                    │  checkout.razorpay.  │
                    │  com/v1/checkout.js  │
                    └──────────┬───────────┘
                               ↓
                 ┌─────────────────────────────┐
                 │   BACKEND (Node.js/Express) │
                 └─────────────────────────────┘
                 │                             │
         ┌───────┴────────┐          ┌────────┴────────┐
         ↓                ↓          ↓                 ↓
    ┌─────────┐    ┌──────────┐  ┌────────┐    ┌────────────┐
    │ Create  │    │ Verify   │  │ Refund │    │ Get Details│
    │ Order   │    │ Payment  │  │Request │    │(Order/Pay) │
    └────┬────┘    └────┬─────┘  └────┬───┘    └───────┬────┘
         │              │              │               │
         └──────────────┴──────────────┴───────────────┘
                       ↓
        ┌───────────────────────────────────┐
        │   RAZORPAY API                    │
        │   https://api.razorpay.com/v1/    │
        └───────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────┐
    │  Razorpay Backend             │
    │  - Order Management           │
    │  - Payment Processing         │
    │  - Settlement                 │
    └───────────┬───────────────────┘
                ↓
    ┌───────────────────────────────┐
    │  Payment Networks             │
    │  - Visa, Mastercard           │
    │  - UPI, NetBanking            │
    │  - Wallets                    │
    └───────────────────────────────┘
```

---

## 2. Payment Flow Diagram

```
PAYMENT FLOW SEQUENCE
═══════════════════════════════════════════════════════════════

┌─────────────┐           ┌─────────────┐           ┌──────────┐
│   CUSTOMER  │           │   BACKEND   │           │ RAZORPAY │
└──────┬──────┘           └──────┬──────┘           └────┬─────┘
       │                         │                       │
       │  1. CLICK PAY BUTTON    │                       │
       ├────────────────────────>│                       │
       │                         │                       │
       │                         │  2. CREATE ORDER      │
       │                         │       (amount, etc)   │
       │                         ├──────────────────────>│
       │                         │                       │
       │                         │<──────────────────────┤
       │                         │  3. ORDER CREATED     │
       │                         │     (order_id)        │
       │<────────────────────────┤                       │
       │  4. OPEN RAZORPAY       │                       │
       │     CHECKOUT MODAL      │                       │
       │  (order_id, amount, key)│                       │
       │                         │                       │
       ├──────────────────────────────────────────────┤  │
       │                                              │  │
       │  5. SELECT PAYMENT METHOD                     │  │
       │  6. ENTER CARD / UPI / OTHER                 │  │
       │  7. AUTHORIZE PAYMENT                        │  │
       │  (Interaction with Razorpay Hosted Checkout) │  │
       │  (or 3D Secure if needed)                    │  │
       │                                              │  │
       │<─────────────────────────────────────────────┤  │
       │                                                  │
       │  8. PAYMENT RESPONSE                            │
       │     (order_id, payment_id, signature)           │
       │     TO HANDLER FUNCTION                         │
       │                                                  │
       ├────────────────────────>│                       │
       │                         │                       │
       │                         │  9. VERIFY PAYMENT    │
       │                         │     (check signature) │
       │                         │                       │
       │                         │  10. UPDATE DATABASE  │
       │                         │      - Order status   │
       │                         │      - Payment record │
       │                         │                       │
       │<────────────────────────┤                       │
       │  11. SUCCESS RESPONSE   │                       │
       │                         │                       │
       │  12. REDIRECT TO        │                       │
       │      ORDER CONFIRMATION │                       │
       │      PAGE               │                       │
       │                         │                       │
       │  13. SEND CONFIRMATION  │                       │
       │      EMAIL              │                       │
       │                         │                       │
       └─────────────────────────┴───────────────────────┘
```

---

## 3. Order Creation Flow

```
CREATE ORDER REQUEST
════════════════════════════════════════════════════════════════

Frontend                          Backend              Razorpay
   │                                 │                    │
   │  POST /api/payment/create-order │                    │
   ├────────────────────────────────>│                    │
   │  {                              │                    │
   │    amount: 50000,               │                    │
   │    currency: "INR",             │                    │
   │    receipt: "receipt_001"       │                    │
   │  }                              │                    │
   │                                 │                    │
   │                                 │  razorpay.orders.  │
   │                                 │  create(options)   │
   │                                 ├───────────────────>│
   │                                 │                    │
   │                                 │  Create Order      │
   │                                 │  Validate Params   │
   │                                 │  Assign Order ID   │
   │                                 │<───────────────────┤
   │                                 │  {                 │
   │<────────────────────────────────┤    id: "order_xxx" │
   │  {                              │    amount: 5000000 │
   │    id: "order_xxx",             │    status: created │
   │    amount: 5000000,             │    ...             │
   │    currency: "INR",             │  }                 │
   │    status: "created",           │                    │
   │    ...                          │                    │
   │  }                              │                    │
   │                                 │                    │
   ✓ ORDER READY FOR PAYMENT         │                    │
```

---

## 4. Payment Verification Flow

```
PAYMENT VERIFICATION
════════════════════════════════════════════════════════════════

Frontend                          Backend              Razorpay
   │                                 │                    │
   │  POST /api/payment/verify       │                    │
   ├────────────────────────────────>│                    │
   │  {                              │                    │
   │    razorpay_order_id: "...",    │                    │
   │    razorpay_payment_id: "...",  │                    │
   │    razorpay_signature: "..."    │                    │
   │  }                              │                    │
   │                                 │                    │
   │                                 │ 1. Extract params  │
   │                                 │ 2. Create body:    │
   │                                 │    order_id|pay_id │
   │                                 │ 3. Compute HMAC:   │
   │                                 │    crypto.createHmac │
   │                                 │    ("sha256",      │
   │                                 │     key_secret)    │
   │                                 │    .update(body)   │
   │                                 │    .digest("hex")  │
   │                                 │                    │
   │                                 │ 4. Compare:        │
   │                                 │    computed ===    │
   │                                 │    received ?      │
   │                                 │                    │
   │<────────────────────────────────┤                    │
   │  {                              │                    │
   │    success: true/false,         │                    │
   │    message: "verified/failed"   │                    │
   │  }                              │                    │
   │                                 │ 5. If Success:     │
   │                                 │    - Update Order  │
   │                                 │    - Save Payment  │
   │                                 │    - Send Email    │
   │                                 │                    │
   ✓ PAYMENT VERIFIED OR FAILED      │                    │
```

---

## 5. Database Schema Diagram

```
DATABASE SCHEMA
════════════════════════════════════════════════════════════════

┌──────────────────────────────────┐
│          USERS Collection        │
├──────────────────────────────────┤
│ _id                              │
│ name                             │
│ email                            │
│ phone                            │
│ address                          │
│ created_at                       │
└────────────┬─────────────────────┘
             │
             │ (1 User -> Many Orders)
             │
             ↓
┌──────────────────────────────────┐       ┌──────────────────────┐
│        ORDERS Collection         │◇──────│  PAYMENTS Collection │
├──────────────────────────────────┤       ├──────────────────────┤
│ _id                              │       │ _id                  │
│ user_id (FK)                     │       │ order_id (FK)        │
│ products []                      │       │ razorpay_order_id    │
│ total_amount                     │       │ razorpay_payment_id  │
│ paymentStatus: pending/completed │       │ razorpay_signature   │
│ paymentId                        │       │ amount               │
│ razorpayOrderId                  │       │ status               │
│ shipping_address                 │       │ method (card/upi/..) │
│ created_at                       │       │ verified: true/false │
│ updated_at                       │       │ created_at           │
└──────────────────────────────────┘       └──────────────────────┘
```

---

## 6. Component Interaction Diagram

```
COMPONENT INTERACTIONS
════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────┐
│         Frontend Components             │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  CheckoutPage Component          │  │
│  │  - Display cart items            │  │
│  │  - Show total amount             │  │
│  │  - Button: "Pay Now"             │  │
│  └────────┬─────────────────────────┘  │
│           │                             │
│           ├─→ RazorpayCheckout Module  │
│           │   - Handle payment         │
│           │   - Open checkout modal    │
│           │   - Verify on success      │
│           │                             │
│           └─→ OrderConfirmation        │
│               - Show success message   │
│               - Order details          │
│               - Tracking info          │
│                                         │
└────────────────┬────────────────────────┘
                 │
         HTTP/REST API
                 │
┌────────────────▼────────────────────────┐
│      Backend Components                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  paymentController.js            │  │
│  │  ├─ createOrder()                │  │
│  │  ├─ verifyPayment()              │  │
│  │  ├─ refundPayment()              │  │
│  │  └─ getPaymentDetails()          │  │
│  └────────────┬─────────────────────┘  │
│               │                         │
│               ├─→ Database Layer        │
│               │   ├─ Save Order         │
│               │   ├─ Update Status      │
│               │   └─ Store Payment      │
│               │                         │
│               ├─→ Email Service         │
│               │   ├─ Confirmation      │
│               │   ├─ Receipt           │
│               │   └─ Notification      │
│               │                         │
│               └─→ Razorpay SDK          │
│                   ├─ Create Orders      │
│                   ├─ Fetch Details      │
│                   └─ Process Refunds    │
│                                         │
└────────────────┬────────────────────────┘
                 │
        Razorpay API
                 │
┌────────────────▼────────────────────────┐
│      Razorpay Backend                   │
├─────────────────────────────────────────┤
│                                         │
│  ├─ Order Management                   │
│  ├─ Payment Processing                 │
│  ├─ Settlement & Reconciliation        │
│  └─ Fraud Detection                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7. Security Layer Diagram

```
SECURITY LAYERS
════════════════════════════════════════════════════════════════

                    ┌─────────────────┐
                    │   HTTPS (SSL)   │
                    │  (In Transit)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ↓                             ↓
    ┌──────────────────┐        ┌──────────────────┐
    │  CORS Policy     │        │  API Keys        │
    │  - Allow Origins │        │  - Key ID        │
    │  - Methods       │        │  - Key Secret    │
    │  - Credentials   │        │  (Never exposed) │
    └──────────────────┘        └──────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             ↓
            ┌────────────────────────────────┐
            │  Signature Verification        │
            │  - HMAC-SHA256                 │
            │  - Order ID | Payment ID       │
            │  - Computed vs Received        │
            └────────────┬───────────────────┘
                         ↓
            ┌────────────────────────────────┐
            │  Input Validation              │
            │  - Amount > 0                  │
            │  - Valid currency             │
            │  - Non-null values             │
            │  - SQL injection prevention    │
            └────────────┬───────────────────┘
                         ↓
            ┌────────────────────────────────┐
            │  Authentication/Authorization  │
            │  - JWT tokens                  │
            │  - User ownership verification │
            │  - Role-based access control   │
            └────────────┬───────────────────┘
                         ↓
            ┌────────────────────────────────┐
            │  Database Security             │
            │  - Encrypted passwords         │
            │  - Hashed sensitive data       │
            │  - Connection pooling          │
            └────────────┬───────────────────┘
                         ↓
            ┌────────────────────────────────┐
            │  Error Handling                │
            │  - No sensitive info in errors │
            │  - Logging without PII         │
            │  - User-friendly messages      │
            └────────────────────────────────┘
```

---

## 8. Razorpay Payment Methods Flowchart

```
PAYMENT METHOD OPTIONS
════════════════════════════════════════════════════════════════

                    ┌──────────────┐
                    │  Razorpay    │
                    │  Checkout    │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         ↓                 ↓                 ↓
    ┌────────────┐   ┌──────────┐   ┌─────────────┐
    │   Cards    │   │   UPI    │   │   Wallets   │
    └─────┬──────┘   └────┬─────┘   └──────┬──────┘
          │               │                 │
    ┌─────┴────┐      ┌────┘            ┌──┴──┐
    ↓          ↓      ↓                 ↓     ↓
 Visa   Mastercard (Google) (Apple)  Paytm Airtel
              │      UPI ID            │    │
              │      (QR)              │    │
              ↓                        ↓    ↓
        Bank Auth                  Wallets...


RECOMMENDATIONS FOR EACH:
- Cards (Visa/Mastercard): International customers, saved cards
- UPI: Domestic India customers, fastest settlement
- Wallets: Repeat customers, faster checkout
- Others: Niche markets, enterprise customers
```

---

## 9. Error Handling Flow

```
ERROR HANDLING FLOW
════════════════════════════════════════════════════════════════

                    Request to Backend
                           ↓
                    ┌───────────────┐
                    │ Validate Input│
                    └───────┬───────┘
                            ↓
                    Is valid?
                    /         \
                   Y           N
                  /             \
                 ↓               ↓
            Process         Return 400
        Create Order      "Invalid input"
            ↓                   ↓
      Call Razorpay         Frontend
            ↓                  │
      Success?         Handle Error
      /     \
    Y       N
   /         \
  ↓           ↓
Save DB    Log Error
  ↓        Return 500
Return   "Server Error"
Order      ↓
  ↓       Frontend
  │      Display
  │      Error Message
  │
Frontend
  ↓
Send to Razorpay
  ↓
Payment Process
  ↓
Success?
/        \
Y         N
/           \
↓            ↓
Capture    Payment Failed
Payment
  ↓
Return
Details
  ↓
Verify
Signature
  ↓
Valid?
/   \
Y     N
/       \
↓       ↓
Update  Log
DB      Fraud
  ↓
Send
Email
  ↓
Frontend
Success
Page
```

---

## 10. Deployment Architecture (Production)

```
PRODUCTION DEPLOYMENT ARCHITECTURE
════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                    CDN (Static Files)                        │
│                  React build, Images, Styles                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Load Balancer (SSL)                         │
│              https://yourdomain.com:443                      │
└──────────────────┬─────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌───────────────┐      ┌───────────────┐
│  Server 1     │      │  Server 2     │
│  (Node.js)    │      │  (Node.js)    │
│  Express.js   │      │  Express.js   │
│  Controllers  │      │  Controllers  │
└────────┬──────┘      └───────┬───────┘
         │                     │
         └──────────┬──────────┘
                    ↓
         ┌──────────────────┐
         │  Connection Pool │
         │  (Database)      │
         └────────┬─────────┘
                  ↓
         ┌──────────────────┐
         │  MongoDB/SQL DB  │
         │  - Users         │
         │  - Orders        │
         │  - Payments      │
         └──────────────────┘
                  │
         ┌────────┴──────────┐
         │                   │
         ↓                   ↓
    ┌─────────┐         ┌─────────┐
    │  Backup │         │  Logs   │
    │  (S3)   │         │ (Cloud) │
    └─────────┘         └─────────┘

External Services:
┌────────────────────────────────────┐
│  - Razorpay API: api.razorpay.com  │
│  - Email: Nodemailer (Gmail/SMTP) │
│  - SMS: (Optional)                 │
│  - Analytics: Google Analytics     │
│  - Monitoring: NewRelic/DataDog    │
└────────────────────────────────────┘

Security:
├─ HTTPS/TLS Encryption
├─ API Keys in Environment Variables
├─ Database Connection Encryption
├─ Rate Limiting
├─ WAF (Web Application Firewall)
├─ DDoS Protection
└─ Regular Security Audits
```

---

## Summary

This visual guide shows:
1. **System Architecture** - How components connect
2. **Payment Flow** - Step-by-step payment process
3. **Order Creation** - Detailed order creation sequence
4. **Payment Verification** - Signature verification process
5. **Database Schema** - Data model relationships
6. **Component Interaction** - Frontend-backend communication
7. **Security Layers** - Multiple security mechanisms
8. **Payment Methods** - Options available
9. **Error Handling** - Error flow and handling
10. **Production Deployment** - Real-world setup

For detailed implementation, refer to:
- [RAZORPAY_BACKEND_EXAMPLE.js](RAZORPAY_BACKEND_EXAMPLE.js)
- [RAZORPAY_IMPLEMENTATION_CHECKLIST.md](RAZORPAY_IMPLEMENTATION_CHECKLIST.md)
- [RAZORPAY_QUICK_TEST.md](RAZORPAY_QUICK_TEST.md)
