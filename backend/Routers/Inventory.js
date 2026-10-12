import express from 'express';
import mongoose from 'mongoose';
import { Products } from '../Database/products_Schema.js';
import { User } from '../Database/users_Schema.js';
import { verifyOwner } from '../Middleware/OwnerAuth.js';
import { isValidStock } from '../Utils/stock.js';

/* --------------------------------------------------------------------------
   Owner-only inventory endpoints.

   Every route is protected by the existing verifyOwner middleware (JWT +
   role === 'owner' from the token), and the mutating PATCH additionally
   re-checks the role in the database (same pattern as the product routes).
   NOTE: verifyOwner sets `req.user` (lowercase), unlike verifyToken which
   sets `req.User`.

   Low-stock rule: a product is "low stock" when
       stock <= lowStockThreshold
   `lowStockThreshold` is a per-product field that defaults to 5
   (DEFAULT_LOW_STOCK_THRESHOLD). Existing documents get the default applied
   by migration_stock_init.js and by the schema default on hydration.
   -------------------------------------------------------------------------- */

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export const inventory = express.Router();

// re-check the owner role against the live DB (a demoted owner with a
// still-valid 1h token must not be able to mutate inventory)
const confirmOwnerInDb = async (req) => {
    const admin = await User.findById(req.user.userId).select('role');
    return Boolean(admin && admin.role === 'owner');
};

// shape a Product document into the inventory view
const toInventoryItem = (product) => {
    const stock = product.stock ?? 0;
    const threshold = product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    const finalPrice =
        product.price - (product.price * (product.discount || 0) / 100);

    return {
        _id: product._id,
        name: product.name,
        Category: product.Category,
        brand: product.brand,
        image: product.image,
        price: product.price,
        discount: product.discount || 0,
        finalPrice,
        stock,
        lowStockThreshold: threshold,
        lowStock: stock <= threshold,
        updatedAt: product.updatedAt
    };
};

// 1. GET /api/inventory — full stock overview, lowest stock first
inventory.get('/api/inventory', verifyOwner, async (req, res) => {
    try {
        const products = await Products.find().sort({ stock: 1, name: 1 });

        if (!products.length) {
            return res.status(404).json({
                message: '📦 No products in inventory yet. Add products first.'
            });
        }

        return res.status(200).json({
            count: products.length,
            inventory: products.map(toInventoryItem)
        });
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load the inventory. Please try again.',
            error: err.message
        });
    }
});

// 2. GET /api/inventory/low-stock — products at or below their threshold
// (defined BEFORE /:productId so "low-stock" is never treated as an ID)
inventory.get('/api/inventory/low-stock', verifyOwner, async (req, res) => {
    try {
        // $expr compares fields per document: stock <= lowStockThreshold,
        // with the documented default (5) filling in for missing values
        const products = await Products.find({
            $expr: {
                $lte: [
                    { $ifNull: ['$stock', 0] },
                    { $ifNull: ['$lowStockThreshold', DEFAULT_LOW_STOCK_THRESHOLD] }
                ]
            }
        }).sort({ stock: 1, name: 1 });

        if (!products.length) {
            return res.status(200).json({
                count: 0,
                message: '✅ Good news — no products are running low on stock.',
                inventory: []
            });
        }

        return res.status(200).json({
            count: products.length,
            inventory: products.map(toInventoryItem)
        });
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load the low-stock report. Please try again.',
            error: err.message
        });
    }
});

// 3. GET /api/inventory/:productId — inventory details for one product
inventory.get('/api/inventory/:productId', verifyOwner, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: '⚠️ Invalid product ID.' });
        }

        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: '😕 Product not found. It may have been removed.'
            });
        }

        return res.status(200).json({
            inventory: toInventoryItem(product)
        });
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load this product\'s inventory. Please try again.',
            error: err.message
        });
    }
});

// 4. PATCH /api/inventory/:productId — owner updates stock (and/or threshold)
// Body: { "stock": 12 }                     -> set absolute stock
//       { "lowStockThreshold": 3 }          -> set the low-stock level
//       { "stock": 0, "lowStockThreshold": 2 } -> both at once
inventory.patch('/api/inventory/:productId', verifyOwner, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: '⚠️ Invalid product ID.' });
        }

        if (!(await confirmOwnerInDb(req))) {
            return res.status(403).json({
                message: '⛔ Owner access required. You do not have permission to do this.'
            });
        }

        const { stock, lowStockThreshold } = req.body;

        if (stock === undefined && lowStockThreshold === undefined) {
            return res.status(400).json({
                message: '⚠️ Provide "stock" and/or "lowStockThreshold" to update.'
            });
        }

        // strict validation — whole numbers, 0 or more; never trust the client
        const updates = {};
        if (stock !== undefined) {
            if (!isValidStock(stock)) {
                return res.status(400).json({
                    message: '⚠️ Stock must be a whole number of 0 or more.'
                });
            }
            updates.stock = stock;
        }
        if (lowStockThreshold !== undefined) {
            if (!isValidStock(lowStockThreshold)) {
                return res.status(400).json({
                    message: '⚠️ Low stock threshold must be a whole number of 0 or more.'
                });
            }
            updates.lowStockThreshold = lowStockThreshold;
        }

        const updatedProduct = await Products.findByIdAndUpdate(
            productId,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: '😕 Product not found. It may have been removed.'
            });
        }

        return res.status(200).json({
            message: '✅ Inventory updated successfully!',
            inventory: toInventoryItem(updatedProduct)
        });
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: '⚠️ ' + err.message
            });
        }
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t update the inventory. Please try again.',
            error: err.message
        });
    }
});
