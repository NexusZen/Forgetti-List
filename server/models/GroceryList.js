const mongoose = require('mongoose');

const GroceryListSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        default: 'My Grocery List'
    },
    items: [{
        name: {
            type: String,
            required: true
        },
        puzzle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Puzzle'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    pointsAwarded: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('GroceryList', GroceryListSchema);
