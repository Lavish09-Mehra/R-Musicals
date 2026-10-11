import express from 'express';
import { User } from '../Database/users_Schema.js';
import bcrypt from 'bcrypt';
import { issueTokenPair } from '../Utils/tokens.js';
export const SignIN = express.Router();

SignIN.post('/api/signin', async (req, res) => {
    try {
        const { name, phone, address, email, password } = req.body;

        if (!name || !phone || !address || !email || !password) {
            return res.status(400).json({
                message: '⚠️ All fields are required. Please fill in every field.'
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const NewUser = new User({
            name,
            phone,
            address,
            email,
            password: hashedPassword,
            role: 'customer'
        });

        const SavedUser = await NewUser.save();

        // toObject -> use to make the mongoose object in JSON form
        const createdUser = SavedUser.toObject();
        delete createdUser.password;

        const { accessToken, refreshToken } = await issueTokenPair(User, SavedUser);
        return res.status(201).json({
            message: "✅ Account created successfully! Welcome aboard.",
            token: accessToken,
            refreshToken
        })
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                message: '⚠️ An account with this email already exists. Please log in instead.'
            });
        }

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: '⚠️ ' + err.message
            });
        }

        return res.status(500).json({
            message: '💥 We could not create your account. Please try again.'
        });
    }
});
