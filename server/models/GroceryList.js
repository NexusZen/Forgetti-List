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
    items: {
        type: [String], // Array of item names
        validate: {
            validator: function (val) {
                return val.length <= 50; // Enforce maximum of 50 items
            },
            message: 'Grocery list cannot exceed 50 items'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GroceryList', GroceryListSchema);
