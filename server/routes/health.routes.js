const express = require('express');
const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

module.exports = router;
