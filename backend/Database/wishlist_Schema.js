import mongoose from 'mongoose';

const WishListSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
    }]
}, { timestamps: true });

export const WishList = mongoose.model('WishList', WishListSchema);