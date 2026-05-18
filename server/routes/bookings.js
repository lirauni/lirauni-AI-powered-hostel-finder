const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sanitizeBooking } = require('../middleware/sanitize');
const router  = express.Router();

// GET /api/bookings — admin/owner sees all, student sees own
router.get('/', verifyToken, async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'student') {
            [rows] = await db.query('SELECT * FROM bookings WHERE LOWER(email) = LOWER(?) ORDER BY created_at DESC', [req.user.email]);
        } else {
            [rows] = await db.query('SELECT * FROM bookings ORDER BY created_at DESC');
        }
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bookings.' });
    }
});

// POST /api/bookings — student submits a booking
router.post('/', verifyToken, sanitizeBooking, async (req, res) => {
    const { student_name, regno, email, phone, gender, year, room_type, hostel_name, book_date } = req.body;

    if (!student_name || !regno || !email || !phone || !gender || !year || !room_type || !hostel_name || !book_date) {
        return res.status(400).json({ error: 'Please fill in all booking details.' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO bookings (student_name, regno, email, phone, gender, year, room_type, hostel_name, book_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_name, regno, email, phone, gender, year, room_type, hostel_name, book_date]
        );
        res.status(201).json({ message: 'Booking submitted successfully!', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit booking.' });
    }
});

// PATCH /api/bookings/:id/status — admin updates status
router.patch('/:id/status', verifyToken, requireRole('admin', 'hostel-owner'), async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Approved', 'Rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    try {
        await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: `Booking ${status.toLowerCase()} successfully.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// PUT /api/bookings/:id — admin edits a booking
router.put('/:id', verifyToken, requireRole('admin', 'hostel-owner'), async (req, res) => {
    const { student_name, regno, email, phone, gender, year, room_type, hostel_name, book_date, status } = req.body;
    try {
        await db.query(
            `UPDATE bookings SET student_name=?, regno=?, email=?, phone=?, gender=?, year=?, room_type=?, hostel_name=?, book_date=?, status=? WHERE id=?`,
            [student_name, regno, email, phone, gender, year, room_type, hostel_name, book_date, status, req.params.id]
        );
        res.json({ message: 'Booking updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update booking.' });
    }
});

// DELETE /api/bookings/:id — admin deletes a booking
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
        res.json({ message: 'Booking deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete booking.' });
    }
});

module.exports = router;
