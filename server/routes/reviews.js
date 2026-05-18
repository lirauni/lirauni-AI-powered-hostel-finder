const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router  = express.Router();

// GET /api/reviews — public (approved only) or admin (all)
router.get('/', async (req, res) => {
    try {
        const isAdmin = req.headers['authorization'];
        let rows;
        if (isAdmin) {
            [rows] = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
        } else {
            [rows] = await db.query("SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC");
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
});

// POST /api/reviews — logged-in student submits a review
router.post('/', verifyToken, async (req, res) => {
    const { hostel_name, rating, comment } = req.body;
    if (!hostel_name || !rating || !comment) {
        return res.status(400).json({ error: 'Please fill in all fields.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO reviews (reviewer, hostel_name, rating, comment) VALUES (?, ?, ?, ?)',
            [req.user.name, hostel_name, rating, comment]
        );
        res.status(201).json({ message: 'Review submitted! Pending admin approval.', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit review.' });
    }
});

// PATCH /api/reviews/:id/approve — admin approves
router.patch('/:id/approve', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query("UPDATE reviews SET status = 'approved' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Review approved.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve review.' });
    }
});

// DELETE /api/reviews/:id — admin deletes
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ message: 'Review deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete review.' });
    }
});

module.exports = router;
