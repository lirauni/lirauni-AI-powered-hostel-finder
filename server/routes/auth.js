const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');
const { sanitizeAuth } = require('../middleware/sanitize');
const router   = express.Router();

// POST /api/auth/register
router.post('/register', sanitizeAuth, async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const validRoles = ['student', 'admin', 'hostel-owner'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    try {
        // Check duplicate email
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists. Please login.' });
        }

        const hashed = await bcrypt.hash(password, 12);
        const [result] = await db.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email.toLowerCase(), phone || '', hashed, role]
        );

        const token = jwt.sign(
            { id: result.insertId, name, email: email.toLowerCase(), role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({ message: 'Account created successfully!', token, user: { id: result.insertId, name, email, role } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', sanitizeAuth, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please fill in all fields.' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password. Please register first.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ message: 'Login successful!', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

module.exports = router;
