import Product from "../models/Product.js";

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        let query = Product.find({});
        // Support ?slim=true to exclude heavy image data (for fast listing)
        if (req.query.slim === 'true') {
            query = query.select('-image');
        }
        const products = await query;
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const { name, price, description, image, brand, category, subcategory, colors, countInStock, stock } = req.body;

        const product = new Product({
            name: name || "Sample name",
            price: price || 0,
            user: req.user._id,
            image: image || "/images/sample.jpg",
            brand: brand || "Sample brand",
            category: category || "Sample category",
            subcategory: subcategory || "top",
            colors: colors || [],
            countInStock: countInStock || stock || 0,
            stock: stock || countInStock || 0,
            numReviews: 0,
            description: description || "Sample description",
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        const { name, price, description, image, brand, category, subcategory, colors, countInStock, stock } =
            req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.price = price || product.price;
            product.description = description || product.description;
            product.image = image || product.image;
            product.brand = brand || product.brand;
            product.category = category || product.category;
            product.subcategory = subcategory || product.subcategory;
            product.colors = colors || product.colors;
            product.countInStock = countInStock || stock || product.countInStock;
            product.stock = stock || countInStock || product.stock;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: "Product removed" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
