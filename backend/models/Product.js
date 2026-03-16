import mongoose from "mongoose";

const productSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        image: { type: String, required: true },
        brand: { type: String, required: true },
        category: { type: String, required: true },
        subcategory: { type: String },
        colors: { type: [String], default: [] },
        sizes: { type: [String], default: ["S", "M", "L", "XL"] },
        description: { type: String, required: true },
        rating: { type: Number, required: true, default: 0 },
        numReviews: { type: Number, required: true, default: 0 },
        price: { type: Number, required: true, default: 0 },
        countInStock: { type: Number, required: true, default: 0 },
        stock: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
