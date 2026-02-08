const GroceryList = require('../models/GroceryList');

// @desc    Get user's grocery lists
// @route   GET /api/grocery
// @access  Private
exports.getGroceryLists = async (req, res) => {
    try {
        const lists = await GroceryList.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('items.puzzle');

        res.status(200).json({
            success: true,
            count: lists.length,
            data: lists
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a new grocery list
// @route   POST /api/grocery
// @access  Private
const Puzzle = require('../models/Puzzle');
const { assignPuzzleType, generatePuzzleData } = require('../utils/puzzleGenerator');

// @desc    Create a new grocery list
// @route   POST /api/grocery
// @access  Private
exports.createGroceryList = async (req, res) => {
    try {
        const { name, items } = req.body;

        // Validation
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Please provide an array of items' });
        }

        // Create the list first to get an ID (items will be populated after puzzle creation)
        const list = new GroceryList({
            user: req.user.id,
            name: name || 'My Grocery List',
            items: []
        });

        const puzzlePromises = items.map(async (itemName) => {
            const type = assignPuzzleType();
            const puzzleData = generatePuzzleData(itemName, type);

            const puzzle = await Puzzle.create({
                user: req.user.id,
                groceryList: list._id,
                groceryItemName: itemName,
                type: type,
                data: puzzleData
            });

            return {
                name: itemName,
                puzzle: puzzle._id
            };
        });

        const itemsWithPuzzles = await Promise.all(puzzlePromises);

        list.items = itemsWithPuzzles;
        await list.save();

        // Populate the list before sending response
        const populatedList = await GroceryList.findById(list._id).populate('items.puzzle');

        res.status(201).json({
            success: true,
            data: populatedList
        });
    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a grocery list
// @route   DELETE /api/grocery/:id
// @access  Private
exports.deleteGroceryList = async (req, res) => {
    try {
        const list = await GroceryList.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ success: false, message: 'List not found' });
        }

        // Make sure user owns the list
        if (list.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this list' });
        }

        await list.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
