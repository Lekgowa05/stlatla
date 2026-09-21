const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// SUBMIT OFFER — POST /api/offers/job/:jobId
router.post('/job/:jobId', auth, async (req, res) => {
    try {
        const { proposed_price, message, availability } = req.body;
        const { jobId } = req.params;

        if (!proposed_price) {
            return res.status(400).json({ error: 'Proposed price required' });
        }

        // Check for duplicate offer
        const existing = await pool.query(
            'SELECT id FROM offers WHERE job_id = $1 AND worker_id = $2',
            [jobId, req.user.id]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'You already submitted an offer for this job' });
        }

        // Make sure the job exists and they're not the poster
        const job = await pool.query('SELECT poster_id FROM jobs WHERE id = $1', [jobId]);
        if (job.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.rows[0].poster_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot apply to your own job' });
        }

        const result = await pool.query(
            `INSERT INTO offers (job_id, worker_id, proposed_price, message, availability)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [jobId, req.user.id, proposed_price, message, availability]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Submit offer error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// VIEW OFFERS FOR A JOB — GET /api/offers/job/:jobId
router.get('/job/:jobId', auth, async (req, res) => {
    try {
        const job = await pool.query('SELECT poster_id FROM jobs WHERE id = $1', [req.params.jobId]);
        if (job.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.rows[0].poster_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the job poster can view offers' });
        }

        const result = await pool.query(
            `SELECT o.*, u.full_name AS worker_name, u.email AS worker_email
             FROM offers o
             JOIN users u ON u.id = o.worker_id
             WHERE o.job_id = $1
             ORDER BY o.created_at DESC`,
            [req.params.jobId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('View offers error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ----------------------------------------------------------
// MY OFFERS — GET /api/offers/my
// ----------------------------------------------------------
router.get('/my', auth, async (req, res) => {
    const result = await pool.query(
        `SELECT o.*, j.title AS job_title, j.location AS job_location
         FROM offers o
         JOIN jobs j ON j.id = o.job_id
         WHERE o.worker_id = $1
         ORDER BY o.created_at DESC`,
        [req.user.id]
    );
    res.json(result.rows);
});

// ACCEPT OFFER — PUT /api/offers/:id/accept
router.put('/:id/accept', auth, async (req, res) => {
    try {
        const offer = await pool.query(
            `SELECT o.*, j.poster_id
             FROM offers o JOIN jobs j ON j.id = o.job_id
             WHERE o.id = $1`,
            [req.params.id]
        );
        if (offer.rows.length === 0) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        if (offer.rows[0].poster_id !== req.user.id) {
            return res.status(403).json({ error: 'Not your job' });
        }

        // Reject all other offers for this job
        await pool.query(
            `UPDATE offers SET status = 'REJECTED' WHERE job_id = $1`,
            [offer.rows[0].job_id]
        );
        // Accept this one
        await pool.query(
            `UPDATE offers SET status = 'ACCEPTED' WHERE id = $1`,
            [req.params.id]
        );
        // Mark the job as active
        await pool.query(
            `UPDATE jobs SET status = 'ACTIVE' WHERE id = $1`,
            [offer.rows[0].job_id]
        );

        res.json({ message: 'Offer accepted' });
    } catch (err) {
        console.error('Accept offer error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;