import { Products } from '../Database/products_Schema.js';
import { Order } from '../Database/order_Schema.js';

/* --------------------------------------------------------------------------
   Shared stock/inventory helpers.

   LIFECYCLE (one consistent strategy across the app):
     1. Cart add/update  -> stock is VALIDATED only (never reserved).
     2. Checkout         -> units are ATOMICALLY DEDUCTED with a conditional
                            update (`stock >= qty`), so concurrent checkouts
                            can never oversell.
     3. Cancellation     -> units are added back EXACTLY ONCE, guarded by the
                            order's stockRestored flag which flips in the same
                            update that cancels the order.
   Adding to a cart NEVER reserves stock; stock is always revalidated at
   checkout, because a product can sell out while sitting in a cart.
   -------------------------------------------------------------------------- */

// ---------- validation ----------
export const isValidQuantity = (q) => Number.isInteger(q) && q >= 1;

// whole number >= 0 (valid for both `stock` and `lowStockThreshold`)
export const isValidStock = (s) => Number.isInteger(s) && s >= 0;

// ---------- atomic stock operations ----------

// Conditional atomic decrement: succeeds ONLY if `quantity` units are still
// available at the exact moment of the update. Returns true on success.
export const deductStock = async (productId, quantity) => {
    const result = await Products.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
    );
    return result.modifiedCount === 1;
};

// Add units back. Used ONLY by cancellation/restock paths.
export const restoreStock = async (productId, quantity) => {
    await Products.updateOne(
        { _id: productId },
        { $inc: { stock: quantity } }
    );
};

// Deduct every item's units atomically, one by one. If any item fails
// (e.g. someone else bought the last units between validation and the
// atomic update), the units already taken in THIS request are added back
// before failing — a failed checkout never leaves stock half-deducted.
export const deductStockForItems = async (items) => {
    const deducted = [];

    for (const item of items) {
        const ok = await deductStock(item.product, item.quantity);

        if (!ok) {
            // roll back the units this request already took
            for (const done of deducted) {
                try {
                    await restoreStock(done.product, done.quantity);
                } catch (rollbackErr) {
                    console.error(
                        `❗ Stock rollback failed for product ${done.product}:`,
                        rollbackErr.message
                    );
                }
            }
            return { ok: false };
        }

        deducted.push(item);
    }

    return { ok: true };
};

// Cancel an order and restore its stock EXACTLY ONCE.
// The status flip and the stockRestored flag happen in ONE atomic update
// guarded by the current status, so repeated cancellation requests or
// duplicate payment callbacks can never restore stock twice.
// Returns the cancelled order, or null when the order doesn't exist,
// was already cancelled, or can no longer be cancelled.
export const cancelOrderAndRestoreStock = async (orderId) => {
    const cancelled = await Order.findOneAndUpdate(
        {
            _id: orderId,
            orderStatus: { $in: ['PLACED', 'CONFIRMED'] },
            stockRestored: { $ne: true }
        },
        { $set: { orderStatus: 'CANCELLED', stockRestored: true } },
        { returnDocument: 'after' }
    );

    if (!cancelled) return null;

    // Only add units back if they were actually deducted at checkout.
    // Legacy orders (stockDeducted: false) are cancelled without restocking.
    if (cancelled.stockDeducted) {
        for (const item of cancelled.items) {
            try {
                await restoreStock(item.product, item.quantity);
            } catch (restoreErr) {
                console.error(
                    `❗ Stock restore failed for order ${cancelled._id}, product ${item.product}:`,
                    restoreErr.message
                );
            }
        }
    }

    return cancelled;
};
