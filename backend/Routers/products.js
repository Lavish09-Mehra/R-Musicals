import { Products } from '../Database/products_Schema.js';
import { User } from '../Database/users_Schema.js';
import { Order } from '../Database/order_Schema.js';
import express from 'express';
import mongoose from 'mongoose';
import { verifyOwner } from '../Middleware/OwnerAuth.js';
import { isValidStock } from '../Utils/stock.js';

export const pro_duct = express.Router();

pro_duct.post('/api/products', verifyOwner, async (req, res) => {
    try {
        const { name, Category, brand, image, description, price, discount, rating, stock } = req.body;

        if (!name?.trim() || !Category?.trim() || !brand?.trim() || !image?.trim() || !description?.trim()) {
            return res.status(400).json({
                message: "⚠️ Please fill in all the basic details (name, category, brand, image, description)."
            });
        }

        const numPrice = Number(price);
        if (!Number.isFinite(numPrice) || numPrice <= 0) {
            return res.status(400).json({
                message: '⚠️ Price must be a positive number.'
            });
        }

        if (discount !== undefined && discount !== null && ![10, 15, 20, 25, 30].includes(discount)) {
            return res.status(400).json({
                message: '⚠️ Discount must be one of 10, 15, 20, 25 or 30.'
            });
        }

        if (rating !== undefined && rating !== null &&
            (!Number.isFinite(Number(rating)) || Number(rating) < 0 || Number(rating) > 5)) {
            return res.status(400).json({
                message: '⚠️ Rating must be a number between 0 and 5.'
            });
        }

        // stock is optional — missing stock defaults to 0 (never unlimited).
        // 0 is a VALID value, so it is checked explicitly instead of `!stock`.
        if (stock !== undefined && stock !== null && !isValidStock(stock)) {
            return res.status(400).json({
                message: '⚠️ Stock must be a whole number of 0 or more.'
            });
        }

        const CreateProduct = new Products({
            name,
            Category,
            brand,
            image,
            description,
            price: numPrice,
            discount: discount ?? undefined,
            rating: rating ?? undefined,
            stock: stock ?? 0
        });

        const data = await CreateProduct.save();

        return res.status(201).json({
            message: "✅ Product listed successfully!",
            data
        });
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: '⚠️ ' + err.message
            });
        }
        return res.status(500).json({
            message: "💥 Oops! Something went wrong while listing the product.",
            error: err.message
        });
    }
});

pro_duct.get('/api/products', async (req, res) => {
    try {
        const GetAllProducts = await Products.find();

        if (!GetAllProducts.length) {
            return res.status(404).json({ message: "😕 No products found. Check back later!" });
        }

        const productsWithFinalPrice = GetAllProducts.map(product => {
            const finalPrice =
                product.price - (product.price * (product.discount || 0) / 100);

            return {
                ...product.toObject(),
                finalPrice
            };
        });

        return res.status(200).json({
            getAllProducts: productsWithFinalPrice
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "💥 Oops! We couldn't load the products. Please try again.",
            error: err.message
        });
    }
});

pro_duct.get('/api/product/category/:category_product', async (req, res) => {
    try {
        const category_product = req.params.category_product;

        const items = await Products.find({ Category: category_product });
        if (!items.length) {
            return res.status(404).json({
                message: `😕 No products found in the "${category_product}" category.`
            });
        }

        const itemsWithFinalPrice = items.map(product => {
            const finalPrice =
                product.price - (product.price * (product.discount || 0) / 100);

            return {
                ...product.toObject(),
                finalPrice
            };
        });

        return res.status(200).json({
            items: itemsWithFinalPrice
        })
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load this category. Please try again.',
            error: err.message
        });
    }
});

pro_duct.get('/api/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: '⚠️ Invalid product ID.'
            });
        }

        const OneProduct = await Products.findById(id);
        if(!OneProduct){
            return res.status(404).json({
                message: "😕 Sorry, this product doesn't exist."
            });
        }

        const finalPrice =
            OneProduct.price - (OneProduct.price * (OneProduct.discount || 0) / 100);

        return res.status(200).json({
            OneProduct: {
                ...OneProduct.toObject(),
                finalPrice
            }
        });
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! Something went wrong. Please try again.',
            error: err.message
        });
    }
});

pro_duct.put('/api/product/:id', verifyOwner, async (req, res) => {

    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: '⚠️ Invalid product ID.' });
        }

        // verifyOwner only reads the JWT role claim; re-check the role in the
        // database so a demoted owner can't act on a stale token.
        // NOTE: verifyOwner sets `req.user` (lowercase), unlike verifyToken
        // which sets `req.User`.
        const FindAdmin = await User.findById(req.user.userId).select('role');
        if (!FindAdmin || FindAdmin.role !== 'owner') {
            return res.status(403).json({ message: '⛔ Owner access required. You do not have permission to do this.' });
        }

        // whitelist — owners may only change these fields (no mass assignment
        // of internals like stock bookkeeping, timestamps, etc.)
        const allowedFields = ['name', 'Category', 'brand', 'image', 'description', 'price', 'discount', 'rating', 'stock'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: '⚠️ No valid fields to update were provided.' });
        }

        if (updates.stock !== undefined && !isValidStock(updates.stock)) {
            return res.status(400).json({ message: '⚠️ Stock must be a whole number of 0 or more.' });
        }

        const updatedProduct = await Products.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );
        if (!updatedProduct) {
            return res.status(404).json({ message: "😕 Product not found. It may have been removed." });
        }

        const finalPrice =
            updatedProduct.price - (updatedProduct.price * (updatedProduct.discount || 0) / 100);

        return res.status(200).json({
            message: "✅ Product updated successfully!",
            data: {
                ...updatedProduct.toObject(),
                finalPrice
            }
        });
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: '⚠️ ' + err.message
            });
        }
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t update the product. Please try again.',
            error: err.message
        });
    }
});

pro_duct.delete('/api/products/:id', verifyOwner, async(req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: '⚠️ Invalid product ID.' });
        }

        // unsafe to delete while the product still belongs to an active
        // (PLACED / CONFIRMED) order — history would lose its reference
        const ActiveOrder = await Order.exists({
            'items.product': id,
            orderStatus: { $in: ['PLACED', 'CONFIRMED'] }
        });

        if (ActiveOrder) {
            return res.status(409).json({
                message: '⚠️ This product has active orders and cannot be deleted yet. Cancel or complete those orders first.'
            });
        }

        const deletedProduct = await Products.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: "😕 Product not found. It may have already been removed." });
        }

        return res.status(200).json({
            message: "✅ Product deleted successfully!",
            data: deletedProduct
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "💥 Oops! We couldn't delete the product. Please try again.",
            error: err.message
        });
    }
});
