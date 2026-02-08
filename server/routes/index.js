const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
// Future routes can be imported here
// const taskRoutes = require('./task.routes');
const authRoutes = require('./auth.routes');
const groceryRoutes = require('./grocery.routes');

// Use routes
// The path here is relative to the mount point in server/index.js (e.g., /api)
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/grocery', groceryRoutes);

module.exports = router;
