import express from 'express';
import { User } from '../Database/users_Schema.js';
import bcrypt from 'bcrypt';
import { issueTokenPair } from '../Utils/tokens.js';

export const LogIN = express.Router();

LogIN.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: '⚠️ Email and password are required.'
            });
        }
        const FindUser = await User.findOne({ email })
            .select('+password');

        if (!FindUser) {
            return res.status(401).json({
                message: '❌ Invalid email or password. Please try again.'
            });
        }
        const isMatched = await bcrypt.compare(password, FindUser.password);

        if (!isMatched) {
            return res.status(401).json({
                message: '❌ Invalid email or password. Please try again.'
            });
        }
        const { accessToken, refreshToken } = await issueTokenPair(User, FindUser);

        return res.status(200).json({
            message: '✅ Login successful. Welcome back!',
            token: accessToken,
            refreshToken,
            user: {
                id: FindUser._id,
                name: FindUser.name,
                email: FindUser.email,
                role: FindUser.role
            }
        });

    } catch (err) {
        return res.status(500).json({
            message: '💥 Something went wrong on our end. Please try again later.'
        });
    }
});
