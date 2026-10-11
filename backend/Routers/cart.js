import express from 'express';
import mongoose from 'mongoose';
import { Cart } from '../Database/cart_Schema.js';
import { Products } from '../Database/products_Schema.js';
import { verifyToken } from '../Middleware/userAuth.js';

export const cart = express.Router();

// Helper: populate the cart, compute each item's finalPrice (after discount),
// each item's itemTotal, and the cart's TotalPrice, then send the response.
const respondWithCart = async (res, statusCode, message, cartDoc) => {
    await cartDoc.populate('items.product');

    const items = cartDoc.items.map(item => {
        const prod = item.product;
        // if the product doc was deleted, populate() yields null -> guard it
        const finalPrice = prod
            ? prod.price - (prod.price * (prod.discount || 0) / 100)
            : 0;

        return {
            ...item.toObject(),
            finalPrice,
            itemTotal: finalPrice * item.quantity
        };
    });

    const TotalPrice = items.reduce((sum, item) => sum + item.itemTotal, 0);

    return res.status(statusCode).json({
        message,
        cart: {
            _id: cartDoc._id,
            user: cartDoc.user,
            items,
            TotalPrice,
            createdAt: cartDoc.createdAt,
            updatedAt: cartDoc.updatedAt
        }
    });
};

cart.post('/api/cart', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { product, quantity } = req.body;

        if (!product || !mongoose.isValidObjectId(product)) {
            return res.status(400).json({
                message: '⚠️ A valid product ID is required.'
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: '⚠️ Quantity must be a whole number of at least 1.'
            });
        }

        // to find the product before putting to Cart
        const FindProduct = await Products.findById(product);
        if (!FindProduct) {
            return res.status(404).json({
                message: '😕 Product not found. It may have been removed.'
            });
        }

        let FindCart = await Cart.findOne({ user });
        if (!FindCart) {
            FindCart = new Cart({
                user,
                items: [{ product, quantity }]
            });
        } else {
            const ExistingItem = FindCart.items.find(
                item => item.product.toString() === product
            );

            if (ExistingItem) {
                ExistingItem.quantity += quantity;
            } else {
                FindCart.items.push({ product, quantity });
            }
        }
        await FindCart.save();

        return respondWithCart(res, 200, '🛒 Product added to cart successfully!', FindCart);

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: '💥 Oops! We couldn\'t add the product to your cart. Please try again.'
        });
    }
});

cart.get('/api/cart', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const GetCart = await Cart.findOne({ user });
        if (!GetCart) {
            return res.status(404).json({
                message: "🛒 Your cart is empty. Add some products to get started!"
            });
        }
        return respondWithCart(res, 200, 'Cart fetched successfully', GetCart);

    } catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load your cart. Please try again.'
        });
    }
});

cart.patch('/api/cart/:product_id', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { product_id } = req.params;
        const { quantity } = req.body;

        if (!mongoose.isValidObjectId(product_id)) {
            return res.status(400).json({
                message: '⚠️ Invalid product ID.'
            });
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: '⚠️ Quantity must be a whole number of at least 1.'
            });
        }
        const FindCart = await Cart.findOne({ user });

        if (!FindCart) {
            return res.status(404).json({
                message: '🛒 Your cart is empty. Add some products to get started!'
            });
        }
        const ExistingItem = FindCart.items.find(
            item => item.product.toString() === product_id
        );

        if (!ExistingItem) {
            return res.status(404).json({
                message: '😕 That product is not in your cart.'
            });
        }
        ExistingItem.quantity = quantity;

        await FindCart.save();

        return respondWithCart(res, 200, '✅ Cart quantity updated successfully!', FindCart);

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: '💥 Oops! We couldn\'t update your cart. Please try again.'
        });
    }
});

cart.delete('/api/cart/:productID_delete', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { productID_delete } = req.params;
        if (!mongoose.isValidObjectId(productID_delete)) {
            return res.status(400).json({
                message: '⚠️ Invalid product ID.'
            });
        }
        const FindCart = await Cart.findOne({ user });

        if (!FindCart) {
            return res.status(404).json({
                message: '🛒 Your cart is empty. Add some products to get started!'
            });
        }
        const ExistingItem = FindCart.items.find(
            item => item.product.toString() === productID_delete
        );

        if (!ExistingItem) {
            return res.status(404).json({
                message: '😕 That product is not in your cart.'
            });
        }
        FindCart.items.pull({
            product: productID_delete
        });
        await FindCart.save();

        // reload fresh from DB so the response reflects the actual saved state
        const UpdatedCart = await Cart.findById(FindCart._id);
        return respondWithCart(res, 200, '✅ Product removed from your cart!', UpdatedCart);

    } catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t remove the product. Please try again.'
        });
    }
});

cart.delete('/api/cart', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;

        const DeleteCart = await Cart.findOneAndDelete({ user });

        if (!DeleteCart) {
            return res.status(404).json({
                message: '🛒 Your cart is already empty.'
            });
        }

        return res.status(200).json({
            message: '✅ Cart cleared successfully!'
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: '💥 Oops! We couldn\'t clear your cart. Please try again.'
        });
    }
});
