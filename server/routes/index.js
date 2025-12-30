const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
// Future routes can be imported here
// const taskRoutes = require('./task.routes');

// Use routes
// The path here is relative to the mount point in server/index.js (e.g., /api)
router.use('/health', healthRoutes);
// router.use('/tasks', taskRoutes);

module.exports = router;
