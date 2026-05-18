const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router  = express.Router();

// GET /api/hostels — public
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hostels ORDER BY rating DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch hostels.' });
    }
});

// GET /api/hostels/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hostels WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Hostel not found.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch hostel.' });
    }
});

// POST /api/hostels — admin/owner adds a hostel
router.post('/', verifyToken, requireRole('admin', 'hostel-owner'), async (req, res) => {
    const { name, distance, price_from, price_to, room_type, facilities, availability } = req.body;
    if (!name || !distance || !price_from) {
        return res.status(400).json({ error: 'Name, distance, and price are required.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO hostels (name, distance, price_from, price_to, room_type, facilities, availability) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, distance, price_from, price_to || price_from, room_type || 'single', facilities || '', availability || 'Available']
        );
        res.status(201).json({ message: 'Hostel added successfully!', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add hostel.' });
    }
});

// PUT /api/hostels/:id — admin/owner updates
router.put('/:id', verifyToken, requireRole('admin', 'hostel-owner'), async (req, res) => {
    const { name, distance, price_from, price_to, room_type, facilities, availability } = req.body;
    try {
        await db.query(
            'UPDATE hostels SET name=?, distance=?, price_from=?, price_to=?, room_type=?, facilities=?, availability=? WHERE id=?',
            [name, distance, price_from, price_to, room_type, facilities, availability, req.params.id]
        );
        res.json({ message: 'Hostel updated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update hostel.' });
    }
});

// DELETE /api/hostels/:id — admin only
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query('DELETE FROM hostels WHERE id = ?', [req.params.id]);
        res.json({ message: 'Hostel deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete hostel.' });
    }
});

module.exports = router;
