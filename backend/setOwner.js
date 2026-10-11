import mongoose from 'mongoose';
import 'dotenv/config.js';

const email = 'lavish@test.com';

try {
    await mongoose.connect(process.env.MONGO_URL);
    const result = await mongoose.connection.collection('users').updateOne(
        { email: email.toLowerCase() },
        { $set: { role: 'owner' } }
    );

    if (result.matchedCount === 0) {
        console.log(`No user found with email ${email}`);
    } else {
        console.log(`${email} is now an OWNER (modified: ${result.modifiedCount === 1})`);
    }
} catch (err) {
    console.error('Error:', err.message);
} finally {
    await mongoose.disconnect();
}
