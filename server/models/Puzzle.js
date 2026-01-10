const mongoose = require('mongoose');

const PuzzleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    groceryList: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroceryList',
        required: true
    },
    groceryItemName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['wordle', 'jumble'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'solved', 'failed'],
        default: 'pending'
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 6 // Default for Wordle, Jumble might be infinite or different
    },
    // Store puzzle-specific data if needed, e.g. scrambled word for jumble
    data: {
        scrambledWord: String, // For jumble
        guesses: [String]      // For wordle
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Puzzle', PuzzleSchema);
