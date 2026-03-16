import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Lock } from 'lucide-react';
import axios from 'axios';

const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart, user } = useStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    // Suppress non-critical tracking errors (lumberjack, sentry)
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            // Suppress Razorpay tracking and Sentry errors
            const errorMsg = String(args[0] || '');
            if (errorMsg.includes('lumberjack') ||
                errorMsg.includes('sentry') ||
                errorMsg.includes('ERR_BLOCKED_BY_CLIENT')) {
                return; // Suppress these non-critical errors
            }
            originalError.apply(console, args);
        };
        return () => {
            console.error = originalError;
        };
    }, []);

    const subtotal = cartTotal();
    const shipping = subtotal > 2000 ? 0 : 1200;
    const total = subtotal + shipping;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        const shippingAddress = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.pincode,
        };

        if (
            !formData.firstName ||
            !formData.address ||
            !formData.email ||
            !formData.city ||
            !formData.state ||
            !formData.pincode
        ) {
            toast.error("Please fill in all required shipping details.");
            setIsProcessing(false);
            return;
        }

        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if (!res) {
            toast.error("Razorpay SDK failed to load. Are you online?");
            setIsProcessing(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            console.log("API URL:", apiUrl);
            console.log("Total Amount:", total);

            // 1. Create Order on Backend
            const { data: orderData } = await axios.post(`${apiUrl}/orders`, {
                amount: total,
            });

            console.log("✅ Order created:", orderData);

            // Format cart items for order
            const formattedOrderItems = cart.map(item => ({
                name: item.name,
                qty: item.quantity,
                image: item.image || "",
                price: item.price,
                product: item.id,
                size: item.selectedSize,
                color: item.color,
            }));

            const shippingAddressData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.pincode,
            };

            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SMIg6PPrZSuoHy";
            console.log("Razorpay Key:", razorpayKey);

            const options = {
                key: razorpayKey,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "StyleAI",
                description: "Purchase from StyleAI",
                image: "/logo.png",
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        console.log("✅ Payment Success Response:", response);
                        console.log("  Payment ID:", response.razorpay_payment_id);
                        console.log("  Order ID:", response.razorpay_order_id);

                        // 2. Verify Payment on Backend
                        const payload = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature || "test_sig",
                            orderItems: formattedOrderItems,
                            shippingAddress: shippingAddressData,
                            totalPrice: total,
                            user: user,
                        };

                        console.log("📤 Sending verification payload:", payload);
                        const { data: verifyData } = await axios.post(`${apiUrl}/orders/verify`, payload);

                        console.log("✅ Payment verified:", verifyData);

                        clearCart();
                        navigate('/order-confirmation', {
                            state: {
                                orderId: verifyData.orderId,
                                items: cart,
                                total: total
                            }
                        });
                        toast.success('Payment Successful! Order placed.');

                    } catch (error) {
                        console.error("❌ Payment Verification Error:", error.message);
                        console.error("Response Status:", error.response?.status);
                        console.error("Response Data:", error.response?.data);
                        console.error("Full Error Stack:", error.stack);

                        const errorMsg = error.response?.data?.error ||
                            error.response?.data?.message ||
                            error.message ||
                            "Verification failed";

                        const validationErrors = error.response?.data?.validationErrors;
                        if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
                            const fieldErrors = validationErrors.map(e => `${e.field}: ${e.message}`).join(", ");
                            toast.error(`Order Error: ${fieldErrors}`);
                        } else {
                            toast.error(`Verification Error: ${errorMsg}`);
                        }
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    contact: "9999999999",
                },
                notes: {
                    note_key_1: "StyleAI Purchase",
                },
                theme: {
                    color: "#667eea",
                },
                modal: {
                    ondismiss: function () {
                        console.log("Payment cancelled by user");
                        toast.info("Payment cancelled");
                        setIsProcessing(false);
                    },
                },
            };

            // Handle Mock Order (Development/Test Mode without real API)
            if (orderData.id.startsWith("order_mock_")) {
                console.log("⚠️ TEST MODE: Opening payment simulation...");
                toast.info("Simulating Razorpay payment...");

                // Add a small delay to simulate checkout loading
                setTimeout(async () => {
                    // Simulate successful payment
                    const mockResponse = {
                        razorpay_payment_id: "pay_" + Math.random().toString(36).substr(2, 14).toUpperCase(),
                        razorpay_order_id: orderData.id,
                        razorpay_signature: "sig_" + Math.random().toString(36).substr(2, 14).toUpperCase(),
                    };

                    console.log("✅ Mock Payment Success:", mockResponse);
                    options.handler(mockResponse);
                }, 2000);
                return;
            }

            // Real Razorpay Test Mode
            console.log("Opening Real Razorpay Checkout with options:", options);
            const paymentObject = new window.Razorpay(options);

            paymentObject.on("payment.failed", function (response) {
                console.error("❌ Payment failed:", response.error);
                toast.error(response.error.description || "Payment failed");
                setIsProcessing(false);
            });

            paymentObject.open();

            paymentObject.on("payment.failed", function (response) {
                console.error("Payment failed:", response.error);
                toast.error(response.error.description || "Payment failed");
                setIsProcessing(false);
            });

            paymentObject.open();

        } catch (error) {
            console.error("❌ Order Creation Error:", error.message);
            console.error("Response Status:", error.response?.status);
            console.error("Response Data:", error.response?.data);
            console.error("Full Error:", error);
            toast.error(`Order Error: ${error.response?.data?.message || error.message || "Something went wrong with order creation."}`);
            setIsProcessing(false);
        }
    };

    if (cart.length === 0) {
        setTimeout(() => navigate('/cart'), 0);
        return null;
    }


    return (
        <div className="min-h-screen bg-secondary/20">
            <Header />

            <main className="pt-24 pb-20">
                <div className="container max-w-5xl">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/cart')}
                        className="mb-8 hover:bg-transparent hover:text-accent pl-0"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Forms Section */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Shipping Details */}
                            <div className="card-elevated p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-accent" />
                                    </div>
                                    <h2 className="text-xl font-display">Shipping Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" name="firstName" placeholder="John" required value={formData.firstName} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" name="lastName" placeholder="Doe" required value={formData.lastName} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" name="email" type="email" placeholder="john@example.com" required value={formData.email} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input id="address" name="address" placeholder="123 Fashion St" required value={formData.address} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" name="city" placeholder="Ahmedabad" required value={formData.city} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input id="state" name="state" placeholder="Gujarat" required value={formData.state} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="pincode">Pincode</Label>
                                        <Input id="pincode" name="pincode" placeholder="380001" required value={formData.pincode} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method - Handled by Razorpay */}
                            <div className="card-elevated p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-accent" />
                                    </div>
                                    <h2 className="text-xl font-display">Payment Method</h2>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-900 font-medium mb-2">✓ All Payment Methods Available</p>
                                    <p className="text-blue-800 text-sm">
                                        Choose from UPI, Cards, Net Banking, Wallets, and EMI options in the secure Razorpay checkout
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="card-elevated p-6 sticky top-28">
                                <h3 className="font-display text-lg mb-4">Order Summary</h3>
                                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                                    {cart.map((item) => (
                                        <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3 text-sm">
                                            <div className="w-12 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium truncate">{item.name}</p>
                                                <p className="text-muted-foreground text-xs">{item.selectedSize} | Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-2 text-lg">
                                        <span>Total</span>
                                        <span>₹{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full btn-gold mt-6 h-12 text-base shadow-lg shadow-accent/20"
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4" /> Pay ₹{total.toFixed(2)}
                                        </span>
                                    )}
                                </Button>
                                <div className="mt-4 flex justify-center gap-2 text-muted-foreground">
                                    <Lock className="w-3 h-3" /> <span className="text-xs">Secure 256-bit SSL Encrypted Payment</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
