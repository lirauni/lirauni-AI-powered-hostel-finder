const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router  = express.Router();

// GET /api/users — admin only
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User removed.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

module.exports = router;
