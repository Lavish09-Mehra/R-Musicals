import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    role: {
        type: String,
        enum: ['customer', 'owner'],
        default: 'customer'
    },

    phone: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    // stores the currently-valid refresh token so it can be revoked on
    // logout / account deletion. select:false keeps it out of normal queries.
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

export const User = mongoose.model('User', UserSchema);