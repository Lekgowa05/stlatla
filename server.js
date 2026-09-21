require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');

const app = express();

// Middleware that runs on EVERY request
app.use(cors());
app.use(express.json());  // parses JSON bodies

// Custom logger — prints every request to the terminal
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Auto-create tables on startup
async function initDb() {
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema ready');
}

// Wire up routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/offers', require('./routes/offers'));

// Health check
app.get('/', (req, res) => res.json({ status: 'NewDawn API running' }));

const PORT = process.env.PORT || 3000;

initDb()
    .then(() => {
        app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
    })
    .catch(err => {
        console.error('DB init failed:', err);
        process.exit(1);
    });