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
    },

    // ---- stock bookkeeping (managed by the order routes, never by clients) ----

    // true once the units for this order were atomically deducted from
    // Products at checkout. Legacy orders created before stock management
    // stay false, so cancelling them will NOT add phantom stock back.
    stockDeducted: {
        type: Boolean,
        default: false
    },

    // true once the units were added back, exactly once (cancellation).
    // This flag is set in the SAME atomic update that cancels the order,
    // so repeated cancel requests / duplicate payment callbacks can never
    // restore stock twice.
    stockRestored: {
        type: Boolean,
        default: false
    },

    // OPTIONAL idempotency key: if the client retries checkout with the same
    // requestId, the existing order is returned instead of creating a
    // duplicate order and deducting stock twice. Fully opt-in.
    requestId: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// one order per (user, requestId) — only enforced when a requestId is sent
OrderSchema.index(
    { user: 1, requestId: 1 },
    { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } }
);

export const Order = mongoose.model('Order', OrderSchema);
