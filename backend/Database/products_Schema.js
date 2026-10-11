import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    Category: {
        required: true,
        type: String
    },
    brand: {
        required: true,
        type: String
    },
    image: {
        required: true,
        type: String
    },
    description: {
        required: true,
        type: String
    },
    price: {
        required: true,
        type: Number
    },
    discount: {
        type: Number,
        enum: [10, 15, 20, 25, 30],
    },
    rating: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Products = mongoose.model('Products', ProductSchema);