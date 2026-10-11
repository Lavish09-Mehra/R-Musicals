import mongoose from 'mongoose';
import 'dotenv/config.js';

try {
    await mongoose.connect(process.env.MONGO_URL);
    const users = await mongoose.connection.collection('users')
        .find({}, { projection: { password: 0 } }).toArray();
    console.table(users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role })));
} catch (err) {
    console.error('Error:', err.message);
} finally {
    await mongoose.disconnect();
}
