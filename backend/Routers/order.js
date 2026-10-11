import express from 'express';
import mongoose from 'mongoose';
import { Order } from '../Database/order_Schema.js';
import { verifyToken } from '../Middleware/userAuth.js';
import { Cart } from '../Database/cart_Schema.js';
import { Products } from '../Database/products_Schema.js';

export const order = express.Router();

order.post('/api/order', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { shippingAddress, paymentMethod = 'COD' } = req.body;

        //To validate userID 
        if (!mongoose.isValidObjectId(user)) {
            return res.status(400).json({
                message: '⚠️ Invalid user session. Please log in again.'
            });
        }
        //If after trim Address not exists return
        if (!shippingAddress?.trim()) {
            return res.status(400).json({
                message: '⚠️ A shipping address is required to place your order.'
            });
        }
        //If Payment option is not from COD and Online return
        if (!['COD', 'ONLINE'].includes(paymentMethod)) {
            return res.status(400).json({
                message: '⚠️ Invalid payment method. Please choose COD or ONLINE.'
            });
        }
        //Find the Cart of Specific User
        const userCart = await Cart.findOne({ user });

        //If cart not exists or items is zero return 
        if (!userCart || userCart.items.length === 0) {
            return res.status(400).json({
                message: '🛒 Your cart is empty. Add some products before checking out.'
            });
        }

        //Order item is initially 0
        const orderItems = [];
        // Initaial Amount is Zero
        let totalAmount = 0;
        //Loop for find every item of cart exists or not
        for (const item of userCart.items) {
            const product = await Products.findById(item.product);
            //if Product not exist return 
            if (!product) {
                return res.status(400).json({
                    message: '😕 A product in your cart no longer exists. Please remove it and try again.'
                });
            } 
            //price Number part of product.price
            const price = Number(product.price);
            //if price is less than 0 or infinite return  
            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({
                    message: '⚠️ A product in your cart has an invalid price.'
                });
            }
            //apply discount (schema only allows 10/15/25/30, fallback to 0)
            const discount = Number.isFinite(Number(product.discount)) ? Number(product.discount) : 0;
            const finalPrice = price - (price * discount / 100);

            //Push the product, quantity, price to an array of order 
            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price,
                discount,
                finalPrice
            });
            //Calculate total item price using the DISCOUNTED price
            totalAmount += finalPrice * item.quantity;
        }
        //create New Order
        const newOrder = await Order.create({
            user,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'PENDING',
            orderStatus: 'PLACED'
        });
        //Store in cart array
        userCart.items = [];
        //then save to datbase
        await userCart.save();
        //Return Order to Frontend
        return res.status(201).json({
            message: '🎉 Order placed successfully! Thank you for shopping with us.',
            order: newOrder
        });
    }
    catch (err) {
        return res.status(500).json({ message: '💥 Oops! Something went wrong while placing your order. Please try again.' });
    }
});

// BUY NOW - place a single-product order directly, WITHOUT touching the cart
order.post('/api/order/direct', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { product, quantity = 1, shippingAddress, paymentMethod = 'COD' } = req.body;

        // validate user id from token
        if (!mongoose.isValidObjectId(user)) {
            return res.status(400).json({ message: '⚠️ Invalid user session. Please log in again.' });
        }
        // product id must be a valid ObjectId
        if (!product || !mongoose.isValidObjectId(product)) {
            return res.status(400).json({ message: '⚠️ A valid product ID is required.' });
        }
        // quantity must be a positive integer
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ message: '⚠️ Quantity must be a whole number of at least 1.' });
        }
        if (!shippingAddress?.trim()) {
            return res.status(400).json({ message: '⚠️ A shipping address is required to place your order.' });
        }
        if (!['COD', 'ONLINE'].includes(paymentMethod)) {
            return res.status(400).json({ message: '⚠️ Invalid payment method. Please choose COD or ONLINE.' });
        }

        // load the product fresh from the DB (source of truth for price)
        const FindProduct = await Products.findById(product);
        if (!FindProduct) {
            return res.status(404).json({ message: '😕 Product not found. It may have been removed.' });
        }

        const price = Number(FindProduct.price);
        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).json({ message: '⚠️ This product has an invalid price.' });
        }

        const discount = Number.isFinite(Number(FindProduct.discount)) ? Number(FindProduct.discount) : 0;
        const finalPrice = price - (price * discount / 100);
        const totalAmount = finalPrice * quantity;

        const newOrder = await Order.create({
            user,
            items: [{ product: FindProduct._id, quantity, price, discount, finalPrice }],
            totalAmount,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'PENDING',
            orderStatus: 'PLACED'
        });

        // NOTE: the cart is intentionally left untouched for Buy Now
        return res.status(201).json({
            message: '🎉 Order placed successfully! Thank you for shopping with us.',
            order: newOrder
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: '💥 Oops! Something went wrong while placing your order. Please try again.' });
    }
});

// 1. GET ALL ORDERS OF LOGGED-IN USER
order.get('/api/orders', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;

        const GetOrders = await Order.find({ user })
            .populate('items.product')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Orders fetched successfully',
            count: GetOrders.length,
            orders: GetOrders
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load your orders. Please try again.'
        });
    }
});


// 2. GET A SINGLE ORDER
order.get('/api/orders/:orderId', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { orderId } = req.params;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                message: '⚠️ Invalid order ID.'
            });
        }

        const GetOrder = await Order.findOne({
            _id: orderId,
            user
        }).populate('items.product');

        if (!GetOrder) {
            return res.status(404).json({
                message: '😕 Order not found. It may have been removed.'
            });
        }

        return res.status(200).json({
            message: 'Order fetched successfully',
            order: GetOrder
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load your order. Please try again.'
        });
    }
});


// 3. CANCEL AN ORDER
order.patch('/api/orders/:orderId/cancel', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { orderId } = req.params;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                message: '⚠️ Invalid order ID.'
            });
        }

        const FindOrder = await Order.findOne({
            _id: orderId,
            user
        });

        if (!FindOrder) {
            return res.status(404).json({
                message: '😕 Order not found. It may have been removed.'
            });
        }

        if (!['PLACED', 'CONFIRMED'].includes(FindOrder.orderStatus)) {
            return res.status(400).json({
                message: '⚠️ This order can no longer be cancelled.'
            });
        }

        FindOrder.orderStatus = 'CANCELLED';

        await FindOrder.save();

        return res.status(200).json({
            message: '✅ Your order has been cancelled.',
            order: FindOrder
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: '💥 Oops! We couldn\'t cancel your order. Please try again.'
        });
    }
});