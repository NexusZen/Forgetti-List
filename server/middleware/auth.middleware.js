const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer <token>)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token payload (decoded.id)
            req.user = await User.findById(decoded.id);

            next();
            return; // Explicit return
        } catch (err) {
            console.error('Auth error:', err);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
            return; // Explicit return
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
        return; // Explicit return
    }
};
