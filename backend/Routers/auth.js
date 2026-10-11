import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../Database/users_Schema.js';
import { signAccessToken, newRefreshTokenId, signRefreshToken } from '../Utils/tokens.js';

export const auth = express.Router();

// POST /api/auth/refresh
// The client sends ONLY the refresh token (no password). We verify it,
// check its opaque id matches what's stored in the DB, then mint a fresh
// access token + rotate the refresh token.
auth.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: '⚠️ Refresh token is required.' });
        }

        // 1. verify signature + expiry
        let decoded;
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
            );
        } catch (err) {
            return res.status(401).json({ message: '⛔ Your session has expired. Please log in again.' });
        }

        // 2. guard against an ACCESS token being passed here by mistake
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ message: '⛔ Invalid token type.' });
        }

        // 3. load user WITH the hidden refreshToken field
        const user = await User.findById(decoded.userId).select('+refreshToken');
        if (!user) {
            return res.status(401).json({ message: '⛔ This account no longer exists.' });
        }

        // 4. the opaque id inside the token must match the stored one
        if (!user.refreshToken || user.refreshToken !== decoded.rt) {
            return res.status(401).json({ message: '⛔ Your session has expired. Please log in again.' });
        }

        // 5. rotate: new opaque id, new access token
        const rt = newRefreshTokenId();
        const accessToken = signAccessToken({ userId: user._id, role: user.role });
        const newRefreshToken = signRefreshToken({ userId: user._id, role: user.role }, rt);

        await User.updateOne({ _id: user._id }, { $set: { refreshToken: rt } });

        return res.status(200).json({
            message: '✅ Session refreshed successfully.',
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: '💥 Oops! Something went wrong. Please try again.' });
    }
});

// POST /api/auth/logout  (needs a valid ACCESS token)
// Clears the stored refresh token so the refresh token can no longer be used.
auth.post('/api/auth/logout', async (req, res) => {
    try {
        const authHeaders = req.headers.authorization;
        if (!authHeaders?.startsWith('Bearer ')) {
            return res.status(401).json({ message: '🔒 You need to be logged in. Please provide a valid token.' });
        }
        const token = authHeaders.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: '⛔ Your session has expired. Please log in again.' });
        }

        await User.updateOne({ _id: decoded.userId }, { $set: { refreshToken: null } });

        return res.status(200).json({ message: '✅ Logged out successfully. See you soon!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: '💥 Oops! Something went wrong. Please try again.' });
    }
});
