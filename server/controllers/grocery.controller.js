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

        // Create the list first to get an ID 
        const list = new GroceryList({
            user: req.user.id,
            name: name || 'My Grocery List',
            items: []
        });

        const puzzlePromises = items.map(async (item) => {
            // Items can be plain strings (legacy) or objects { name, imageUrl }
            const itemName = typeof item === 'string' ? item : item.name;
            const imageUrl = typeof item === 'object' ? (item.imageUrl || null) : null;

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
                imageUrl,
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

// @desc    Update a grocery list (edit name, add/remove/rename items)
// @route   PUT /api/grocery/:id
// @access  Private
exports.updateGroceryList = async (req, res) => {
    try {
        const list = await GroceryList.findById(req.params.id).populate('items.puzzle');

        if (!list) {
            return res.status(404).json({ success: false, message: 'List not found' });
        }

        if (list.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const { name, items } = req.body;

        // Update list name if provided
        if (name) list.name = name;

        if (items && Array.isArray(items)) {
            // Build a map of existing item IDs to their puzzle refs
            const existingMap = {};
            list.items.forEach(item => {
                if (item._id) {
                    existingMap[item._id.toString()] = item;
                }
            });

            // Determine which existing items are kept (by _id)
            const keptIds = new Set();
            const newItems = [];

            for (const incoming of items) {
                if (incoming._id && existingMap[incoming._id]) {
                    // Existing item — keep the puzzle ref, but allow name rename
                    const existing = existingMap[incoming._id];
                    keptIds.add(incoming._id);

                    // If name changed and puzzle is still pending, update puzzle's groceryItemName
                    if (incoming.name && incoming.name !== existing.name && existing.puzzle) {
                        const puzzleStatus = typeof existing.puzzle === 'object' ? existing.puzzle.status : null;
                        if (puzzleStatus === 'pending') {
                            // Regenerate puzzle data for the new name
                            const type = assignPuzzleType();
                            const puzzleData = generatePuzzleData(incoming.name, type);
                            await Puzzle.findByIdAndUpdate(
                                typeof existing.puzzle === 'object' ? existing.puzzle._id : existing.puzzle,
                                { groceryItemName: incoming.name, type, data: puzzleData }
                            );
                        }
                    }

                    newItems.push({
                        _id: existing._id,
                        name: incoming.name || existing.name,
                        imageUrl: incoming.imageUrl !== undefined ? incoming.imageUrl : existing.imageUrl,
                        puzzle: typeof existing.puzzle === 'object' ? existing.puzzle._id : existing.puzzle
                    });
                } else {
                    // Brand new item — create a puzzle for it
                    const itemName = typeof incoming === 'string' ? incoming : incoming.name;
                    const imageUrl = typeof incoming === 'object' ? (incoming.imageUrl || null) : null;

                    const type = assignPuzzleType();
                    const puzzleData = generatePuzzleData(itemName, type);

                    const puzzle = await Puzzle.create({
                        user: req.user.id,
                        groceryList: list._id,
                        groceryItemName: itemName,
                        type,
                        data: puzzleData
                    });

                    newItems.push({
                        name: itemName,
                        imageUrl,
                        puzzle: puzzle._id
                    });
                }
            }

            // Delete puzzles for removed items
            for (const [id, item] of Object.entries(existingMap)) {
                if (!keptIds.has(id) && item.puzzle) {
                    const puzzleId = typeof item.puzzle === 'object' ? item.puzzle._id : item.puzzle;
                    await Puzzle.findByIdAndDelete(puzzleId);
                }
            }

            list.items = newItems;
        }

        await list.save();

        const populatedList = await GroceryList.findById(list._id).populate('items.puzzle');

        res.status(200).json({ success: true, data: populatedList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
