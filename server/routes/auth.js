// /server/routes/auth.js

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 🟢 FIX: Import User model correctly using wildcard and accessing the default property
import * as UserModel from '../models/User.js';
const User = UserModel.default || UserModel; // Access the model

const router = express.Router();

// ✅ Test route to confirm route registration
router.get('/test', (req, res) => {
    res.send('✅ Auth route is working');
});

// 🔐 Signup route with role support
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        // Hash the password securely
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user with role (default to 'user')
        const user = new User({
            email,
            passwordHash,
            role: role && ["user", "admin"].includes(role) ? role : "user"
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(400).json({
            error: 'Signup failed',
            details: err.message
        });
    }
});

// 🔐 Login route with JWT including role
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        // Generate JWT with role
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({
            error: 'Login failed',
            details: err.message
        });
    }
});

export default router;