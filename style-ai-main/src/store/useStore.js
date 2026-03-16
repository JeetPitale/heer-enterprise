import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { products as initialProducts } from '@/data/products';
import API from '@/lib/api';

export const useStore = create()(
    persist(
        (set, get) => ({
            // State
            isLoading: false,
            error: null,

            // Cart
            cart: [],
            // ... (keep search/cart methods same) ...
            addToCart: (product, size, color) => {
                set((state) => {
                    const existingItem = state.cart.find(
                        (item) => item.id === (product.id || product._id) && item.selectedSize === size && item.selectedColor === color
                    );
                    if (existingItem) {
                        return {
                            cart: state.cart.map((item) =>
                                item.id === (product.id || product._id) && item.selectedSize === size && item.selectedColor === color
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        };
                    }
                    return {
                        cart: [...state.cart, { ...product, id: product.id || product._id, quantity: 1, selectedSize: size, selectedColor: color }],
                    };
                });
            },
            removeFromCart: (productId) => {
                set((state) => ({
                    cart: state.cart.filter((item) => item.id !== productId),
                }));
            },
            updateQuantity: (productId, quantity) => {
                set((state) => ({
                    cart: state.cart.map((item) =>
                        item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
                    ),
                }));
            },
            clearCart: () => set({ cart: [] }),
            cartTotal: () => get().cart.reduce((total, item) => total + item.price * item.quantity, 0),
            cartCount: () => get().cart.reduce((count, item) => count + item.quantity, 0),

            // Wishlist
            wishlist: [],
            addToWishlist: (product) => {
                set((state) => {
                    const pid = product.id || product._id;
                    if (state.wishlist.find((item) => (item.id || item._id) === pid)) {
                        return state;
                    }
                    return { wishlist: [...state.wishlist, { ...product, id: pid }] };
                });
            },
            removeFromWishlist: (productId) => {
                set((state) => ({
                    wishlist: state.wishlist.filter((item) => (item.id || item._id) !== productId),
                }));
            },
            isInWishlist: (productId) => get().wishlist.some((item) => (item.id || item._id) === productId),

            // Saved Styles
            savedStyles: [],
            addSavedStyle: (style) => {
                set((state) => ({ savedStyles: [...state.savedStyles, style] }));
            },
            removeSavedStyle: (styleId) => {
                set((state) => ({
                    savedStyles: state.savedStyles.filter((style) => style.id !== styleId),
                }));
            },
            updateSavedStyleName: (styleId, name) => {
                set((state) => ({
                    savedStyles: state.savedStyles.map((style) =>
                        style.id === styleId ? { ...style, name } : style
                    ),
                }));
            },

            // Products & Admin
            products: initialProducts,
            fetchProducts: async () => {
                try {
                    const { data } = await API.get('/products');
                    const formatted = data.map(p => ({ ...p, id: p._id }));
                    set({ products: formatted });

                    // Also update inventory from products
                    const inv = data.map(p => ({
                        id: p._id,
                        name: p.name,
                        sku: p.sku || `SKU-${p._id.substring(0, 5).toUpperCase()}`,
                        stock: p.stock || p.countInStock || 0,
                        status: (p.stock || p.countInStock) < 5 ? 'Critical' : ((p.stock || p.countInStock) < 15 ? 'Low Stock' : 'In Stock')
                    }));
                    set({ inventory: inv });
                } catch (err) {
                    console.error('Failed to fetch products', err);
                    import('sonner').then(({ toast }) => {
                        toast.error('Failed to load products from database');
                    });
                }
            },
            setProducts: (items) => set({ products: items }),
            addProduct: (product) => {
                set((state) => ({ products: [...state.products, { ...product, id: product._id || product.id }] }));
                // Refresh to sync
                get().fetchProducts();
            },
            updateProduct: (id, updates) => {
                set((state) => ({
                    products: state.products.map((p) => ((p.id || p._id) === id ? { ...p, ...updates } : p)),
                }));
                get().fetchProducts();
            },
            deleteProduct: (id) => {
                set((state) => ({
                    products: state.products.filter((p) => (p.id || p._id) !== id),
                }));
                get().fetchProducts();
            },

            // Inventory
            inventory: [],
            addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
            updateInventoryItem: (id, updates) => set((state) => ({
                inventory: state.inventory.map((i) => (i.id === id ? { ...i, ...updates } : i)),
            })),
            deleteInventoryItem: (id) => set((state) => ({
                inventory: state.inventory.filter((i) => i.id !== id),
            })),

            // Users
            users: [],
            fetchUsers: async () => {
                try {
                    const { data } = await API.get('/auth/users');
                    const formatted = data.map(u => ({
                        id: u._id,
                        name: u.name,
                        email: u.email,
                        role: u.email === 'admin@heer.com' ? 'Admin' : 'User',
                        joined: new Date(u.createdAt).toLocaleDateString()
                    }));
                    set({ users: formatted });
                } catch (err) {
                    console.error('Failed to fetch users', err);
                    const errorMsg = err.response?.data?.message || err.message;
                    import('sonner').then(({ toast }) => {
                        toast.error(`Database Error: ${errorMsg}`);
                    });
                }
            },
            addUser: (user) => set((state) => ({ users: [...state.users, user] })),
            updateUser: (id, updates) => set((state) => ({
                users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
            })),
            deleteUser: (id) => {
                set((state) => ({
                    users: state.users.filter((u) => u.id !== id),
                }));
                get().fetchUsers(); // Refresh
            },

            // Orders
            orders: [],
            fetchOrders: async () => {
                const user = get().user;
                if (!user) return;

                try {
                    const endpoint = user.role === 'admin' ? '/orders' : '/orders/myorders';
                    const { data } = await API.get(endpoint);
                    const formatted = data.map(o => ({
                        id: o._id,
                        customer: o.userName || o.user?.name || (o.shippingAddress ? `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}` : 'Customer'),
                        email: o.userEmail || o.shippingAddress?.email || 'N/A',
                        date: new Date(o.createdAt).toLocaleDateString(),
                        total: o.totalPrice,
                        items: o.orderItems?.length || 0,
                        status: o.status,
                        orderItems: o.orderItems
                    }));
                    set({ orders: formatted });
                } catch (err) {
                    console.error('Failed to fetch orders', err);
                    import('sonner').then(({ toast }) => {
                        toast.error('Failed to load orders from database');
                    });
                }
            },
            setOrders: (items) => set({ orders: items }),
            updateOrderStatus: (id, status) => {
                set((state) => ({
                    orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
                }));
            },

            // Authentication
            user: null,
            login: (userData) => {
                // Check if admin
                if (userData.email === 'admin@heer.com') {
                    set({ user: { ...userData, role: 'admin' } });
                } else {
                    set({ user: { ...userData, role: 'user' } });
                }
                // Fetch data for the user
                get().fetchOrders();
                if (get().user.role === 'admin') {
                    get().fetchUsers();
                    get().fetchProducts();
                }
            },
            logout: () => {
                set({ user: null, orders: [], users: [] });
                window.location.reload();
            },
            updateProfile: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                }));
            },
        }),
        {
            name: 'aurelia-store',

            // Only persist UI state, cart, and authentication
            partialize: (state) => ({
                cart: state.cart,
                wishlist: state.wishlist,
                savedStyles: state.savedStyles,
                user: state.user,
                products: state.products, // Catalog can persist for speed
                inventory: state.inventory,
            }),
        }
    )
);
