import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft, FileText, CheckCircle, CreditCard } from 'lucide-react';
import API from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function InvoicePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const invoiceRef = useRef();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await API.get(`/orders/${id}`);
                setOrder(data);
            } catch (error) {
                console.error('Failed to fetch order for invoice:', error);
                toast.error('Could not load invoice data');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-grow pt-24 flex items-center justify-center">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 w-12 bg-secondary rounded-full mx-auto"></div>
                        <div className="h-4 w-48 bg-secondary rounded mx-auto"></div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-grow pt-24 pb-16">
                    <div className="container max-w-4xl text-center py-20">
                        <h1 className="text-2xl font-display mb-4">Invoice Not Found</h1>
                        <p className="text-muted-foreground mb-8">We couldn't find the invoice you're looking for.</p>
                        <Button onClick={() => navigate('/my-orders')}>Back to My Orders</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const subtotal = order.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.18; // Assuming 18% GST for demo
    const shipping = 0; // Free shipping
    const total = order.totalPrice;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header className="print:hidden" />
            
            <main className="flex-grow pt-24 pb-16">
                <div className="container max-w-4xl">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-8 print:hidden">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handlePrint} className="gap-2">
                                <Printer className="h-4 w-4" /> Print Invoice
                            </Button>
                            <Button className="btn-primary gap-2" onClick={handlePrint}>
                                <Download className="h-4 w-4" /> Download PDF
                            </Button>
                        </div>
                    </div>

                    {/* Invoice Paper */}
                    <div 
                        ref={invoiceRef}
                        className="bg-card border border-border rounded-xl shadow-lg p-8 md:p-12 print:shadow-none print:border-none print:p-0"
                    >
                        {/* Invoice Header */}
                        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 border-b border-border pb-8">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-primary mb-2">HEER ENTERPRISE</h1>
                                <p className="text-sm text-muted-foreground">123 Fashion Street, Surat, Gujarat</p>
                                <p className="text-sm text-muted-foreground">GSTIN: 24AAAAA0000A1Z5</p>
                                <p className="text-sm text-muted-foreground">contact@heerenterprise.com</p>
                            </div>
                            <div className="text-left md:text-right">
                                <h2 className="text-2xl font-display uppercase tracking-wider mb-2">Invoice</h2>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Invoice No: <span className="font-mono">INV-{order._id.slice(-6).toUpperCase()}</span></p>
                                    <p className="text-sm text-muted-foreground">Order ID: #{order._id}</p>
                                    <p className="text-sm text-muted-foreground">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Status: <span className={cn(
                                            "font-semibold",
                                            order.isPaid ? "text-green-600" : "text-yellow-600"
                                        )}>{order.isPaid ? 'PAID' : 'PENDING'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Payment Info */}
                        <div className="grid md:grid-cols-2 gap-12 mb-12">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Bill To</h3>
                                <div className="space-y-1">
                                    <p className="font-medium text-lg">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{order.shippingAddress.address}</p>
                                    <p className="text-sm text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                                    <p className="text-sm text-muted-foreground">{order.shippingAddress.email}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Payment Details</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm font-medium">Method: Online (Razorpay)</p>
                                    </div>
                                    {order.isPaid && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <p className="text-sm text-muted-foreground">Transaction ID: {order.paymentResult?.razorpay_payment_id || 'N/A'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12 overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-y border-border">
                                    <tr>
                                        <th className="text-left py-4 px-2 font-semibold text-sm uppercase">Product</th>
                                        <th className="text-center py-4 px-2 font-semibold text-sm uppercase">Qty</th>
                                        <th className="text-right py-4 px-2 font-semibold text-sm uppercase">Price</th>
                                        <th className="text-right py-4 px-2 font-semibold text-sm uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {order.orderItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-6 px-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-secondary rounded overflow-hidden print:hidden">
                                                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">Color: {item.color} | Size: {item.size}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-2 text-center">{item.qty}</td>
                                            <td className="py-6 px-2 text-right">₹{item.price.toLocaleString()}</td>
                                            <td className="py-6 px-2 text-right font-medium">₹{(item.price * item.qty).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end border-t border-border pt-8">
                            <div className="w-full max-w-xs space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">GST (18%):</span>
                                    <span>₹{tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-border pb-3">
                                    <span className="text-muted-foreground">Shipping:</span>
                                    <span className="text-green-600 font-medium">FREE</span>
                                </div>
                                <div className="flex justify-between text-xl font-display font-bold text-primary pt-2">
                                    <span>Grand Total:</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="mt-16 text-center border-t border-border pt-8">
                            <p className="text-sm font-medium mb-1">Thank you for shopping with Heer Enterprise!</p>
                            <p className="text-xs text-muted-foreground italic">Computer generated invoice. No signature required.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer className="print:hidden" />

            {/* Print specific styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { background: white; margin: 0; padding: 0; }
                    .container { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    main { padding-top: 0 !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                }
            `}} />
        </div>
    );
}
