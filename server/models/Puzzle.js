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
        enum: ['wordle', 'jumble', 'word_grid', 'hangman'],
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
        default: 6
    },
    // Store puzzle-specific data
    data: {
        scrambledWord: String,      // For jumble
        guesses: [String],          // For wordle
        grid: [[String]],           // For word_grid (2D array of chars)
        solution: [{                // For word_grid (path)
            row: Number,
            col: Number,
            char: String
        }],
        guessedLetters: [String],   // For hangman
        wrongGuesses: { type: Number, default: 0 } // For hangman
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Puzzle', PuzzleSchema);
