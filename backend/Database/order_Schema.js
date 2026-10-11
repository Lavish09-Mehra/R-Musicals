import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        finalPrice: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    shippingAddress: {
        type: String,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        default: 'COD'
    },

    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },

    orderStatus: {
        type: String,
        enum: [
            'PLACED',
            'CONFIRMED',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
        ],
        default: 'PLACED'
    }
}, { timestamps: true });

export const Order = mongoose.model('Order', OrderSchema);
