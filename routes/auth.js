const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// REGISTER — POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, password, location } = req.body;

        // 1. Basic validation
        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 2. Check if email already exists
        const exists = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // 3. Encrypt the password using bcrypt (10 rounds)
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Insert the user
        const result = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, location)
             VALUES ($1, $2, $3, $4)
             RETURNING id, full_name, email, location`,
            [full_name, email, password_hash, location || null]
        );

        const user = result.rows[0];

        // 5. Create a JWT token for this user
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// LOGIN — POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Compare the entered password with the stored hash
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                location: user.location
            },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET CURRENT USER — GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    const result = await pool.query(
        `SELECT id, full_name, email, location, language, notifications_enabled
         FROM users WHERE id = $1`,
        [req.user.id]
    );
    res.json(result.rows[0]);
});

// UPDATE SETTINGS — PUT /api/auth/settings
router.put('/settings', auth, async (req, res) => {
    try {
        const { language, notifications_enabled } = req.body;
        await pool.query(
            `UPDATE users
             SET language = COALESCE($1, language),
                 notifications_enabled = COALESCE($2, notifications_enabled)
             WHERE id = $3`,
            [language, notifications_enabled, req.user.id]
        );
        res.json({ message: 'Settings updated' });
    } catch (err) {
        console.error('Settings error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// CHANGE PASSWORD — PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            return res.status(400).json({ error: 'Missing passwords' });
        }

        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );
        const match = await bcrypt.compare(old_password, result.rows[0].password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Old password incorrect' });
        }

        const newHash = await bcrypt.hash(new_password, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newHash, req.user.id]
        );
        res.json({ message: 'Password changed' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;