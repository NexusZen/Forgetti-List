const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Routes
const routes = require('./routes/index');

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Database Connection
const connectDB = require('./config/db');
connectDB();

// Use Routes
app.use('/api', routes);

// Global Error Handler (Basic)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Root Route (for basic connectivity check)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
