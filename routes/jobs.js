const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// LIST ALL OPEN JOBS — GET /api/jobs?search=...&category=...
router.get('/', auth, async (req, res) => {
    try {
        const { category, location, search } = req.query;
        let query = `
            SELECT j.*, u.full_name AS poster_name
            FROM jobs j
            JOIN users u ON u.id = j.poster_id
            WHERE j.status = 'OPEN'
        `;
        const params = [];

        if (category) {
            params.push(category);
            query += ` AND j.category = $${params.length}`;
        }
        if (location) {
            params.push(`%${location}%`);
            query += ` AND j.location ILIKE $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`;
        }
        query += ' ORDER BY j.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('List jobs error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// MY JOBS — GET /api/jobs/my
router.get('/my', auth, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM jobs WHERE poster_id = $1 ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json(result.rows);
});

// GET ONE JOB — GET /api/jobs/:id
router.get('/:id', auth, async (req, res) => {
    const result = await pool.query(
        `SELECT j.*, u.full_name AS poster_name
         FROM jobs j
         JOIN users u ON u.id = j.poster_id
         WHERE j.id = $1`,
        [req.params.id]
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
});

// CREATE JOB — POST /api/jobs
router.post('/', auth, async (req, res) => {
    try {
        const { title, category, description, location, budget } = req.body;
        if (!title || !category || !description || !location || !budget) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const result = await pool.query(
            `INSERT INTO jobs (poster_id, title, category, description, location, budget)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.id, title, category, description, location, budget]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create job error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE JOB STATUS — PUT /api/jobs/:id/status
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            `UPDATE jobs SET status = $1
             WHERE id = $2 AND poster_id = $3 RETURNING *`,
            [status, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update job error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;