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

        // live stock info so the UI can flag items that sold out while
        // sitting in the cart (additive fields — nothing removed)
        const availableStock = prod ? (prod.stock ?? 0) : 0;

        return {
            ...item.toObject(),
            finalPrice,
            itemTotal: finalPrice * item.quantity,
            availableStock,
            inStock: item.quantity <= availableStock
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

        // adding to the cart NEVER reserves stock — availability is only
        // checked here and revalidated at checkout. Never trust a quantity
        // or price sent by the frontend: stock always comes from the DB.
        const availableStock = FindProduct.stock ?? 0;
        if (availableStock < 1) {
            return res.status(409).json({
                message: `😕 "${FindProduct.name}" is out of stock right now.`
            });
        }

        let FindCart = await Cart.findOne({ user });

        // when the product is already in the cart, the NEW TOTAL quantity
        // (existing + requested) must fit within the available stock
        const ExistingItem = FindCart?.items.find(
            item => item.product.toString() === product
        );
        const quantityInCart = ExistingItem ? ExistingItem.quantity : 0;

        if (quantityInCart + quantity > availableStock) {
            return res.status(409).json({
                message: `🧺 Only ${availableStock} unit(s) of "${FindProduct.name}" are in stock${quantityInCart ? ` and you already have ${quantityInCart} in your cart` : ''}. Please lower the quantity.`
            });
        }

        if (!FindCart) {
            FindCart = new Cart({
                user,
                items: [{ product, quantity }]
            });
        } else if (ExistingItem) {
            // total = existing quantity + newly requested quantity
            ExistingItem.quantity += quantity;
        } else {
            FindCart.items.push({ product, quantity });
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

        // same stock validation as adding — quantities can never exceed
        // what is actually available right now
        const FindProduct = await Products.findById(product_id);
        if (!FindProduct) {
            return res.status(404).json({
                message: '😕 This product no longer exists. Please remove it from your cart.'
            });
        }

        const availableStock = FindProduct.stock ?? 0;
        if (quantity > availableStock) {
            return res.status(409).json({
                message: `🧺 Only ${availableStock} unit(s) of "${FindProduct.name}" are in stock. Please lower the quantity.`
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
