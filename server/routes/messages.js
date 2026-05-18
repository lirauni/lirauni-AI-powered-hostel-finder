const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sanitizeMessage } = require('../middleware/sanitize');
const { sendReplyEmail } = require('../utils/mailer');
const router  = express.Router();

// POST /api/messages — anyone can send a message
router.post('/', sanitizeMessage, async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Please fill in all fields.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]
        );
        res.status(201).json({ message: 'Message sent successfully!', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// GET /api/messages/mine — student sees their own messages by email
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM messages WHERE LOWER(email) = LOWER(?) ORDER BY created_at DESC',
            [req.user.email]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

// GET /api/messages — admin only
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

// PATCH /api/messages/:id/read — mark as read
router.patch('/:id/read', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query('UPDATE messages SET is_read = 1 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Marked as read.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update message.' });
    }
});

// PATCH /api/messages/:id/reply — admin saves reply and emails the sender
router.patch('/:id/reply', verifyToken, requireRole('admin'), async (req, res) => {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: 'Reply cannot be empty.' });
    try {
        const replyDate = new Date().toLocaleString('en-GB');

        // Save reply, timestamp, and reset student_read so student gets notified
        await db.query(
            'UPDATE messages SET reply = ?, reply_date = ?, student_read = 0 WHERE id = ?',
            [reply, replyDate, req.params.id]
        );

        // Fetch the message to get sender details
        const [rows] = await db.query('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            const msg = rows[0];
            try {
                await sendReplyEmail(msg.email, msg.subject, msg.name, msg.message, reply);
                res.json({ message: 'Reply saved and email sent to ' + msg.email });
            } catch (emailErr) {
                console.error('Email send failed:', emailErr.message);
                res.json({
                    message: 'Reply saved. Email could not be sent — check MAIL_PASS in .env',
                    emailError: emailErr.message
                });
            }
        } else {
            res.json({ message: 'Reply saved.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to save reply.' });
    }
});

// PATCH /api/messages/:id/student-read — student marks reply as read
router.patch('/:id/student-read', verifyToken, async (req, res) => {
    try {
        // Only allow the message owner to mark it read
        const [rows] = await db.query('SELECT email FROM messages WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Message not found.' });
        if (rows[0].email.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ error: 'Forbidden.' });
        }
        await db.query('UPDATE messages SET student_read = 1 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Marked as read.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update.' });
    }
});

// DELETE /api/messages/:id
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
        res.json({ message: 'Message deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete message.' });
    }
});

// DELETE /api/messages — clear all
router.delete('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query('DELETE FROM messages');
        res.json({ message: 'All messages cleared.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear messages.' });
    }
});

module.exports = router;
