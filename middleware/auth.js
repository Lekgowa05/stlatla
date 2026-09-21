const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // The Android app sends the token in a header like:
    //   Authorization: Bearer eyJhbGciOi...
    const header = req.header('Authorization');
    if (!header) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.replace('Bearer ', '');

    try {
        // Verify the token was signed by us (using JWT_SECRET)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Attach { id, email } to the request
        next();  // Continue to the actual route handler
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};