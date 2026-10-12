import express from 'express';
import { User } from '../Database/users_Schema.js';
import { Cart } from '../Database/cart_Schema.js';
import { WishList } from '../Database/wishlist_Schema.js';
import { Order } from '../Database/order_Schema.js';
import { verifyToken } from '../Middleware/userAuth.js';
import { verifyOwner } from '../Middleware/OwnerAuth.js';
import { cancelOrderAndRestoreStock } from '../Utils/stock.js';
export const user = express.Router()


user.get('/api/users', verifyOwner, async(req, res) => {
    try{
        const users = await User.find().select('-password -refreshToken');
        if(!users.length){
            return res.status(404).json({
                message: '👥 No users found.'
            });
        } 
        return res.status(200).json({
            user: users
        });
    }
    catch(err){
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load the users. Please try again.'
        })
    }
});

// GET a single user profile by ID (only own account)
user.get('/api/user/:id', verifyToken, async(req, res) => {
    try{
        const { id } = req.params;

        // user can only see their own profile
        if(req.User.userId !== id){
            return res.status(403).json({
                message: '⛔ You are not allowed to view this account.'
            });
        }

        // password has select:false in schema, so it is excluded automatically
        const findUser = await User.findById(id);
        if(!findUser){
            return res.status(404).json({
                message: '😕 User not found.'
            });
        }
        return res.status(200).json({
            user: findUser
        });
    }
    catch(err){
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load this profile. Please try again.',
            error: err.message
        });
    }
});

// DELETE own account
user.delete('/api/user/:id/delete', verifyToken, async(req, res) => {
    try{
        const { id } = req.params;

        // user can only delete their own account
        if(req.User.userId !== id){
            return res.status(403).json({
                message: '⛔ You are not allowed to delete this account.'
            });
        }

        const findUser = await User.findById(id);
        if(!findUser){
            return res.status(404).json({
                message: '😕 User not found.'
            });
        }

        // cancel all active orders (PLACED / CONFIRMED) and add their units
        // back to stock EXACTLY ONCE — cancelOrderAndRestoreStock is guarded
        // by the stockRestored flag, so this is safe even if repeated
        const ActiveOrders = await Order.find({
            user: id,
            orderStatus: { $in: ['PLACED', 'CONFIRMED'] }
        }).select('_id');

        let cancelledCount = 0;
        for (const activeOrder of ActiveOrders) {
            const cancelled = await cancelOrderAndRestoreStock(activeOrder._id);
            if (cancelled) cancelledCount++;
        }

        // delete user's cart and wishlist
        await Cart.findOneAndDelete({ user: id });
        await WishList.findOneAndDelete({ user: id });

        // finally delete the account
        await User.findByIdAndDelete(id);

        return res.status(200).json({
            message: '✅ Account deleted successfully. We\'re sorry to see you go!',
            cancelledOrders: cancelledCount,
            user: {
                id: findUser._id,
                name: findUser.name,
                email: findUser.email
            }
        });
    }
    catch(err){
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t delete this account. Please try again.',
            error: err.message
        });
    }
});