import API from "./api";

// Create Razorpay Order
export const createRazorpayOrder = async ({ amount, currency = "INR", receipt, notes = {} }) => {
  try {
    const response = await API.post("/payment/create-order", {
      amount,
      currency,
      receipt,
      notes,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verify Razorpay Payment
export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  try {
    const response = await API.post("/payment/verify", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get Payment Details
export const getPaymentDetails = async (paymentId) => {
  try {
    const response = await API.get(`/payment/${paymentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Refund Payment
export const refundPayment = async ({ paymentId, amount, notes = {} }) => {
  try {
    const response = await API.post("/payment/refund", {
      paymentId,
      amount,
      notes,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Load Razorpay Script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Open Razorpay Checkout
export const openRazorpayCheckout = async ({
  orderId,
  amount,
  customerEmail,
  customerPhone,
  customerName,
  onSuccess,
  onError,
}) => {
  const isScriptLoaded = await loadRazorpayScript();

  if (!isScriptLoaded) {
    onError("Failed to load Razorpay checkout");
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
    amount: Math.round(amount * 100), // Convert to paise
    currency: "INR",
    name: "StyleAI",
    description: "Payment for StyleAI products",
    image: "/logo.png",
    order_id: orderId,
    handler: function (response) {
      onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    prefill: {
      name: customerName || "",
      email: customerEmail || "",
      contact: customerPhone || "",
    },
    notes: {
      note_key_1: "StyleAI Purchase",
    },
    theme: {
      color: "#667eea",
    },
    modal: {
      ondismiss: function () {
        onError("Payment window closed");
      },
    },
  };

  const rzp1 = new window.Razorpay(options);
  rzp1.on("payment.failed", function (response) {
    onError({
      code: response.error.code,
      description: response.error.description,
      source: response.error.source,
      step: response.error.step,
      reason: response.error.reason,
      metadata: response.error.metadata,
    });
  });
  rzp1.open();
};
