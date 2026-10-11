import mongoose from 'mongoose';

const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }]
}, {
    timestamps: true
});

export const Cart = mongoose.model('Cart', CartSchema);