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
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: '⚠️ Stock must be a whole number (no fractions, no negatives).'
        }
    },

    // owner-tunable level at which a product is flagged as "low stock".
    // Used by GET /api/inventory/low-stock. Default: 5 (documented default,
    // applied to existing documents by migration_stock_init.js as well).
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: '⚠️ Low stock threshold must be a whole number (0 or more).'
        }
    }
}, { timestamps: true });

export const Products = mongoose.model('Products', ProductSchema);