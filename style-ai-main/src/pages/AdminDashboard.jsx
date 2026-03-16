import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, LogOut, Package, ShoppingBag, BarChart3, Users, Layers, AlertCircle, FileText } from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';
import { InventoryForm } from '@/components/admin/InventoryForm';
import { UserForm } from '@/components/admin/UserForm';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import API from '@/lib/api';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const {
        user, products, fetchProducts, addProduct, updateProduct, deleteProduct, logout,
        orders, updateOrderStatus, fetchOrders,
        inventory, // Fetched inside fetchProducts
        users, fetchUsers, addUser, updateUser, deleteUser
    } = useStore();

    // Modals State
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
    const [editingInventory, setEditingInventory] = useState(null);

    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Calculate Real Analytics Data from Orders
    const salesByDay = orders.reduce((acc, order) => {
        const date = new Date(order.date);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        acc[day] = (acc[day] || 0) + order.total;
        return acc;
    }, {});

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const analyticsData = days.map(day => ({
        name: day,
        sales: salesByDay[day] || 0
    }));

    // Protect Route and Fetch Data
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            toast.error('Unauthorized access');
            navigate('/login');
        } else {
            // Use store fetchers
            fetchProducts();
            fetchOrders();
            fetchUsers();
        }
    }, [user, navigate, fetchProducts, fetchOrders, fetchUsers]);

    if (!user || user.role !== 'admin') return null;

    // --- Product Handlers ---
    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsProductFormOpen(true);
    };
    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setIsProductFormOpen(true);
    };
    const handleDeleteProduct = async (id) => {
        if (confirm('Delete this product?')) {
            try {
                // Determine if it's a mongo _id (usually a 24 char hex string)
                if (typeof id === 'string' && id.length >= 24) {
                    await API.delete(`/products/${id}`);
                }
                // Call local store delete to immediately update UI
                deleteProduct(id);
                toast.success('Product deleted successfully');
            } catch (err) {
                console.error("Delete product error:", err);
                toast.error(err.response?.data?.message || 'Failed to delete product from database');
            }
        }
    };
    const handleProductSubmit = async (data) => {
        try {
            if (editingProduct) {
                // Determine if it's a mongo _id
                const id = editingProduct.id || editingProduct._id;
                const { data: updated } = await API.put(`/products/${id}`, data);
                updateProduct(id, { ...updated, id: updated._id });
                toast.success('Product updated in database');
            } else {
                const { data: created } = await API.post('/products', data);
                addProduct({ ...created, id: created._id });
                toast.success('Product created and saved to database');
            }
            setIsProductFormOpen(false);
        } catch (err) {
            console.error("Product submit error detailed:", {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
                config: err.config
            });
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save product to database';
            toast.error(`Error: ${errorMsg}`);
        }
    };

    // --- Inventory Handlers ---
    const handleAddInventory = () => {
        setEditingInventory(null);
        setIsInventoryFormOpen(true);
    };
    const handleEditInventory = (item) => {
        setEditingInventory(item);
        setIsInventoryFormOpen(true);
    };
    const handleDeleteInventory = async (id) => {
        if (confirm('Delete this product and its inventory?')) {
            try {
                await API.delete(`/products/${id}`);
                deleteProduct(id);
                toast.success('Product and inventory removed');
            } catch (err) {
                toast.error('Failed to delete');
            }
        }
    };
    const handleInventorySubmit = async (data) => {
        try {
            // Inventory in this UI is tied to Product Stock
            const id = editingInventory ? editingInventory.id : data.productId;
            if (!id) {
                toast.error("Please select a product first");
                return;
            }
            // Update the product's stock
            await API.put(`/products/${id}`, { stock: data.stock, countInStock: data.stock });
            fetchProducts(); // Refresh both
            toast.success(editingInventory ? 'Inventory updated' : 'Item added');
            setIsInventoryFormOpen(false);
        } catch (err) {
            toast.error('Failed to update inventory in database');
        }
    };

    // --- User Handlers ---
    const handleAddUser = () => {
        setEditingUser(null);
        setIsUserFormOpen(true);
    };
    const handleEditUser = (u) => {
        setEditingUser(u);
        setIsUserFormOpen(true);
    };
    const handleDeleteUser = async (id) => {
        if (confirm('Delete this user?')) {
            try {
                await API.delete(`/auth/users/${id}`);
                deleteUser(id);
                toast.success('User deleted from database');
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };
    const handleUserSubmit = async (data) => {
        try {
            if (editingUser) {
                await API.put(`/auth/users/${editingUser.id}`, data);
                toast.success('User updated in database');
            } else {
                await API.post('/auth/users', data);
                toast.success('User created in database');
            }
            fetchUsers();
            setIsUserFormOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save user');
        }
    };

    // --- Export Handler ---
    const handleExportUsers = () => {
        if (!users || users.length === 0) {
            toast.error('No users to export');
            return;
        }

        // Define CSV headers
        const headers = ['Name', 'Email', 'Role', 'Joined Date'];

        // Convert users data to CSV rows
        // Add BOM for Excel/Spreadsheet compatibility
        const csvContent = '\uFEFF' + [
            headers.map(h => `"${h}"`).join(','),
            ...users.map(u => [
                `"${u.name || ''}"`,
                `"${u.email || ''}"`,
                `"${u.role || ''}"`,
                `"${u.joined || ''}"`
            ].join(','))
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportOrders = () => {
        if (!orders || orders.length === 0) {
            toast.error('No orders to export');
            return;
        }

        // Define CSV headers
        const headers = [
            'Order ID', 'Customer', 'Email', 'Date', 'Total', 'Status', 
            'Payment Status', 'Items Count', 'Address', 'City', 'ZIP'
        ];

        // Convert orders data to CSV rows
        const csvContent = '\uFEFF' + [
            headers.map(h => `"${h}"`).join(','),
            ...orders.map(o => [
                `"${o.id || ''}"`,
                `"${o.customer || ''}"`,
                `"${o.email || ''}"`,
                `"${o.date || ''}"`,
                `"${o.total || 0}"`,
                `"${o.status || ''}"`,
                `"${o.isPaid ? 'Paid' : 'Pending'}"`,
                `"${o.items || 0}"`,
                `"${o.address || ''}"`,
                `"${o.city || ''}"`,
                `"${o.zip || ''}"`
            ].join(','))
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `heer_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Admin Header */}
            <header className="border-b border-border bg-card">
                <div className="container py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-display font-medium leading-tight">Heer Enterprise Admin</h1>
                            <p className="text-xs text-muted-foreground">Management Console</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                fetchProducts();
                                fetchOrders();
                                fetchUsers();
                                toast.success('Syncing with MongoDB...');
                            }}
                            className="hidden md:flex"
                        >
                            Refresh Data
                        </Button>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px] md:max-w-none">Logged in as {user.name}</span>
                        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container py-8">
                <Tabs defaultValue="products" className="space-y-8">
                    <TabsList className="bg-secondary/50 p-1 h-auto flex-wrap justify-start w-full md:w-auto">
                        <TabsTrigger value="products" className="gap-2 px-6 py-2">
                            <Package className="h-4 w-4" /> Products
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="gap-2 px-6 py-2">
                            <ShoppingBag className="h-4 w-4" /> Orders
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2 px-6 py-2">
                            <BarChart3 className="h-4 w-4" /> Analytics
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="gap-2 px-6 py-2">
                            <Layers className="h-4 w-4" /> Inventory
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2 px-6 py-2">
                            <Users className="h-4 w-4" /> Users
                        </TabsTrigger>
                    </TabsList>

                    {/* PRODUCTS TAB */}
                    <TabsContent value="products" className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-medium mb-1">Products Inventory</h2>
                                <p className="text-muted-foreground">Manage your catalog ({products.length} items)</p>
                            </div>
                            <Button onClick={handleAddProduct} className="btn-primary">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product
                            </Button>
                        </div>
                        <div className="bg-card rounded-lg border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-secondary/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Image</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Name</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Category</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Price</th>
                                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="h-12 w-12 rounded bg-secondary overflow-hidden">
                                                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-medium">{product.name}</td>
                                                <td className="py-3 px-4 capitalize text-muted-foreground">{product.category} / {product.subcategory}</td>
                                                <td className="py-3 px-4 font-medium">₹{product.price}</td>
                                                <td className="py-3 px-4 text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                                                        <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ORDERS TAB */}
                    <TabsContent value="orders" className="animate-fade-in">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Order Management</CardTitle>
                                        <CardDescription>View and manage customer orders.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleExportOrders}>Export CSV</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full">
                                    <thead className="bg-secondary/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Order ID</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Customer</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Total</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                                            <th className="text-right py-3 px-4 font-medium text-sm">Invoice</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {orders && orders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="py-3 px-4 font-mono">{order.id}</td>
                                                <td className="py-3 px-4">
                                                    <div>{order.customer}</div>
                                                    <div className="text-[10px] text-muted-foreground">{order.email}</div>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
                                                <td className="py-3 px-4">₹{order.total}</td>
                                                <td className="py-3 px-4">
                                                    <Select
                                                        defaultValue={order.status}
                                                        onValueChange={async (val) => {
                                                            try {
                                                                await API.put(`/orders/${order.id}/status`, { status: val });
                                                                updateOrderStatus(order.id, val);
                                                                toast.success(`Order status updated to ${val}`);
                                                            } catch (e) {
                                                                toast.error('Failed to update status');
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Processing">Processing</SelectItem>
                                                            <SelectItem value="Shipped">Shipped</SelectItem>
                                                            <SelectItem value="Delivered">Delivered</SelectItem>
                                                            <SelectItem value="In Transit">In Transit</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link to={`/order/invoice/${order.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:bg-primary/10">
                                                            <FileText className="h-4 w-4" /> View
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ANALYTICS TAB */}
                    <TabsContent value="analytics" className="animate-fade-in">
                        {/* ... (Keep Analytics Content Same) ... */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sales Overview</CardTitle>
                                    <CardDescription>Weekly sales performance.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="sales" fill="#D61F69" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Usage Stats</CardTitle>
                                    <CardDescription>Style Scan adoption rate.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-10">
                                        <div className="text-5xl font-bold text-accent mb-2">84%</div>
                                        <p className="text-muted-foreground">of users try AI Style Scan</p>
                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                            <div className="bg-secondary p-4 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Total Scans</p>
                                                <p className="text-xl font-medium">1,240</p>
                                            </div>
                                            <div className="bg-secondary p-4 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Matches Found</p>
                                                <p className="text-xl font-medium">980</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* INVENTORY TAB */}
                    <TabsContent value="inventory" className="animate-fade-in">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Inventory Control</CardTitle>
                                        <CardDescription>Monitor stock levels and alerts.</CardDescription>
                                    </div>
                                    <Button onClick={handleAddInventory} size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full">
                                    <thead className="bg-secondary/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Product Name</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">SKU</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Stock Level</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                                            <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {inventory && inventory.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3 px-4 font-medium">{item.name}</td>
                                                <td className="py-3 px-4 font-mono text-sm text-muted-foreground">{item.sku}</td>
                                                <td className="py-3 px-4">{item.stock}</td>
                                                <td className="py-3 px-4">
                                                    {item.status === 'Critical' && <span className="flex items-center gap-2 text-destructive font-medium text-sm"><AlertCircle className="h-4 w-4" /> Critical</span>}
                                                    {item.status === 'Low Stock' && <span className="text-orange-500 font-medium text-sm">Low Stock</span>}
                                                    {item.status === 'In Stock' && <span className="text-green-600 font-medium text-sm">In Stock</span>}
                                                </td>
                                                <td className="py-3 px-4 text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditInventory(item)}>
                                                        <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteInventory(item.id)}>
                                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* USERS TAB */}
                    <TabsContent value="users" className="animate-fade-in">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>User Management</CardTitle>
                                        <CardDescription>View registered users.</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleExportUsers}>Export CSV</Button>
                                        <Button onClick={handleAddUser} size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add User
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full">
                                    <thead className="bg-secondary/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">Joined</th>
                                            <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {users && users.map((u) => (
                                            <tr key={u.id}>
                                                <td className="py-3 px-4 font-medium">{u.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={u.role === 'Admin' ? 'default' : 'outline'}>{u.role}</Badge>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{u.joined}</td>
                                                <td className="py-3 px-4 text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(u)}>
                                                        <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)}>
                                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <ProductForm
                open={isProductFormOpen}
                onOpenChange={setIsProductFormOpen}
                initialData={editingProduct}
                onSubmit={handleProductSubmit}
            />

            <InventoryForm
                open={isInventoryFormOpen}
                onOpenChange={setIsInventoryFormOpen}
                initialData={editingInventory}
                onSubmit={handleInventorySubmit}
            />

            <UserForm
                open={isUserFormOpen}
                onOpenChange={setIsUserFormOpen}
                initialData={editingUser}
                onSubmit={handleUserSubmit}
            />
        </div>
    );
}
