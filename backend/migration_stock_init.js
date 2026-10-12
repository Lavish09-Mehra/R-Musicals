import mongoose from 'mongoose';
import 'dotenv/config.js';

/* --------------------------------------------------------------------------
   One-time (idempotent) initialization for stock management.

   Run with:  npm run migrate:stock

   What it does:
     - every product WITHOUT a `stock` value gets stock = 0
       (a missing stock value must never be treated as "unlimited")
     - every product WITHOUT `lowStockThreshold` gets the documented
       default of 5

   Safe to run any number of times — it only touches documents that are
   missing the fields, and never lowers or overwrites existing values.
   -------------------------------------------------------------------------- */

try {
    await mongoose.connect(process.env.MONGO_URL);

    const products = mongoose.connection.collection('products');

    const missingStock = await products.updateMany(
        { $or: [{ stock: { $exists: false } }, { stock: null }] },
        { $set: { stock: 0 } }
    );

    const missingThreshold = await products.updateMany(
        { lowStockThreshold: { $exists: false } },
        { $set: { lowStockThreshold: 5 } }
    );

    console.log(
        `✅ Stock migration complete: ` +
        `${missingStock.modifiedCount} product(s) set to stock=0, ` +
        `${missingThreshold.modifiedCount} product(s) given lowStockThreshold=5.`
    );
} catch (err) {
    console.error('Migration error:', err.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
