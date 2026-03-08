const Puzzle = require('../models/Puzzle');
const GroceryList = require('../models/GroceryList');
const Leaderboard = require('../models/Leaderboard');

// Simple dictionary check (placeholder - could be expanded)
const isValidWord = (word) => {
    return word.length > 0; // Check length against target is done in verify
};

// Helper to generate Word Grid
const generateWordGrid = (word) => {
    const size = 10;
    const grid = Array(size).fill(null).map(() => Array(size).fill(''));
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, ''); // Ensure only letters

    // Directions: [rowDelta, colDelta]
    // 0: Horizontal, 1: Vertical, 2: Diagonal Down-Right, 3: Diagonal Up-Right
    const directions = [
        [0, 1], [1, 0], [1, 1], [-1, 1]
    ];

    let placed = false;
    let solution = [];

    // Try to place word
    let attempts = 0;
    while (!placed && attempts < 100) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const [dRow, dCol] = dir;

        // Calculate valid start ranges
        const len = cleanWord.length;

        // Random start position logic... simplified
        let row = Math.floor(Math.random() * size);
        let col = Math.floor(Math.random() * size);

        // Check bounds
        const endRow = row + (len - 1) * dRow;
        const endCol = col + (len - 1) * dCol;

        if (endRow >= 0 && endRow < size && endCol >= 0 && endCol < size) {
            // Place it
            solution = [];
            for (let i = 0; i < len; i++) {
                grid[row + i * dRow][col + i * dCol] = cleanWord[i];
                solution.push({ row: row + i * dRow, col: col + i * dCol, char: cleanWord[i] });
            }
            placed = true;
        }
    }

    // Fill empty cells
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!grid[r][c]) {
                grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }

    return { grid, solution };
};

exports.verifyGuess = async (req, res) => {
    const { puzzleId } = req.params;
    const { guess, status } = req.body;

    try {
        const puzzle = await Puzzle.findById(puzzleId);

        if (!puzzle) {
            return res.status(404).json({ success: false, message: 'Puzzle not found' });
        }

        if (puzzle.status === 'solved' || puzzle.status === 'failed') {
            return res.status(400).json({ success: false, message: 'Puzzle already completed' });
        }

        let result = null;
        let targetWord = puzzle.groceryItemName ? puzzle.groceryItemName.trim().toUpperCase() : '';

        // --- WORD GRID LOGIC ---
        if (puzzle.type === 'word_grid') {
            if (status === 'solved') {
                puzzle.status = 'solved';
            } else if (status === 'failed') {
                puzzle.status = 'failed';
            } else {
                return res.status(400).json({ success: false, message: 'Invalid status for Word Grid' });
            }
        }
        // --- HANGMAN LOGIC ---
        else if (puzzle.type === 'hangman') {
            const letterGuess = guess ? guess.trim().toUpperCase() : '';

            if (letterGuess.length !== 1 || !/^[A-Z]$/.test(letterGuess)) {
                return res.status(400).json({ success: false, message: 'Please guess a single letter' });
            }

            if (!puzzle.data) puzzle.data = {};
            if (!puzzle.data.guessedLetters) puzzle.data.guessedLetters = [];
            if (puzzle.data.wrongGuesses === undefined) puzzle.data.wrongGuesses = 0;

            // Check if already guessed
            if (puzzle.data.guessedLetters.includes(letterGuess)) {
                return res.status(400).json({ success: false, message: 'You already guessed that letter!' });
            }

            puzzle.data.guessedLetters.push(letterGuess);

            const cleanTarget = targetWord.replace(/[^A-Z]/g, '');
            const isCorrectGuess = cleanTarget.includes(letterGuess);

            if (!isCorrectGuess) {
                puzzle.data.wrongGuesses += 1;
            }

            // Check win: all letters in the word have been guessed
            const uniqueTargetLetters = [...new Set(cleanTarget.split(''))];
            const allGuessed = uniqueTargetLetters.every(l => puzzle.data.guessedLetters.includes(l));

            if (allGuessed) {
                puzzle.status = 'solved';
            } else if (puzzle.data.wrongGuesses >= puzzle.maxAttempts) {
                puzzle.status = 'failed';
            }

            result = {
                letterGuess,
                isCorrect: isCorrectGuess,
                guessedLetters: puzzle.data.guessedLetters,
                wrongGuesses: puzzle.data.wrongGuesses,
                maxAttempts: puzzle.maxAttempts
            };

            // Mark dirty for Mongoose mixed type
            puzzle.markModified('data');
        }
        // --- WORDLE LOGIC ---
        else {
            if (puzzle.attempts >= puzzle.maxAttempts) {
                puzzle.status = 'failed';
                await puzzle.save();
                return res.status(200).json({ success: false, message: 'Max attempts reached', status: 'failed' });
            }

            const userGuess = guess ? guess.trim().toUpperCase() : '';

            if (userGuess.length !== targetWord.length) {
                return res.status(400).json({ success: false, message: `Guess must be ${targetWord.length} letters long` });
            }

            result = new Array(targetWord.length).fill(null).map(() => ({ letter: '', status: 'absent' }));
            const targetLettersCount = {};

            for (let char of targetWord) {
                targetLettersCount[char] = (targetLettersCount[char] || 0) + 1;
            }

            // First pass: Find CORRECT letters (Green)
            for (let i = 0; i < targetWord.length; i++) {
                const letter = userGuess[i];
                result[i].letter = letter;
                if (letter === targetWord[i]) {
                    result[i].status = 'correct';
                    targetLettersCount[letter]--;
                }
            }

            // Second pass: Find PRESENT letters (Yellow)
            for (let i = 0; i < targetWord.length; i++) {
                if (result[i].status === 'correct') continue;

                const letter = userGuess[i];
                if (targetLettersCount[letter] > 0) {
                    result[i].status = 'present';
                    targetLettersCount[letter]--;
                } else {
                    result[i].status = 'absent';
                }
            }

            const isSolved = result.every(r => r.status === 'correct');
            puzzle.attempts += 1;

            if (!puzzle.data) puzzle.data = {};
            if (!puzzle.data.guesses) puzzle.data.guesses = [];
            puzzle.data.guesses.push(userGuess);

            if (isSolved) {
                puzzle.status = 'solved';
            } else if (puzzle.attempts >= puzzle.maxAttempts) {
                puzzle.status = 'failed';
            }
        }

        await puzzle.save();

        let pointsReceived = false;
        let newTotalPoints = req.user.points || 0;

        // Check if this solved or failed puzzle finishes a list
        if (puzzle.status === 'solved' || puzzle.status === 'failed') {
            const list = await GroceryList.findOne({
                'items.puzzle': puzzle._id
            }).populate('items.puzzle');

            if (list) {
                const isFinished = list.items.every(item =>
                    item.puzzle && (item.puzzle.status === 'solved' || item.puzzle.status === 'failed')
                );

                if (isFinished && !list.pointsAwarded) {
                    list.pointsAwarded = true;
                    await list.save();

                    const totalItems = list.items.length;
                    const solvedItems = list.items.filter(item => item.puzzle && item.puzzle.status === 'solved').length;
                    
                    // Fun scoring formula!
                    // 50 pts per solved item
                    // 10 pts just for trying (per total items)
                    // 250 pt perfection bonus
                    let calculatedPoints = (solvedItems * 50) + (totalItems * 10);
                    if (totalItems > 0 && solvedItems === totalItems) {
                        calculatedPoints += 250; 
                    }
                    if (calculatedPoints === 0) calculatedPoints = 5;

                    // Increment user points
                    req.user.points = (req.user.points || 0) + calculatedPoints;
                    await req.user.save();

                    // Update Leaderboard
                    await Leaderboard.findOneAndUpdate(
                        { user: req.user._id },
                        {
                            $set: {
                                username: req.user.username,
                                totalPoints: req.user.points,
                                lastUpdated: Date.now()
                            }
                        },
                        { upsert: true, new: true }
                    );

                    pointsReceived = calculatedPoints;
                    newTotalPoints = req.user.points;
                }
            }
        }

        res.status(200).json({
            success: true,
            status: puzzle.status,
            result: result,
            remainingAttempts: puzzle.maxAttempts - puzzle.attempts,
            solution: (puzzle.status === 'failed' || puzzle.status === 'solved') ? targetWord : undefined,
            pointsReceived,
            newTotalPoints
        });

    } catch (err) {
        console.error('Error in verifyGuess:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getPuzzle = async (req, res) => {
    try {
        const puzzle = await Puzzle.findById(req.params.id);
        if (!puzzle) {
            return res.status(404).json({ success: false, message: 'Puzzle not found' });
        }
        res.status(200).json({ success: true, data: puzzle });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updatePuzzleType = async (req, res) => {
    try {
        const { type } = req.body;
        const puzzle = await Puzzle.findById(req.params.id);

        if (!puzzle) {
            return res.status(404).json({ success: false, message: 'Puzzle not found' });
        }

        if (puzzle.type !== type || !puzzle.data || !puzzle.data.grid) {
            puzzle.type = type;
            puzzle.attempts = 0;
            puzzle.status = 'pending';

            if (type === 'wordle') {
                puzzle.data = { guesses: [] };
            } else if (type === 'word_grid') {
                const { grid, solution } = generateWordGrid(puzzle.groceryItemName);
                puzzle.data = { grid, solution };
            } else if (type === 'hangman') {
                puzzle.data = { guessedLetters: [], wrongGuesses: 0 };
            } else {
                puzzle.data = {};
            }

            await puzzle.save();
        }

        res.status(200).json({ success: true, data: puzzle });
    } catch (err) {
        console.error("Update Type Error", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Give up and fail a puzzle
// @route   POST /api/puzzle/:id/fail
// @access  Private
exports.failPuzzle = async (req, res) => {
    try {
        const puzzle = await Puzzle.findById(req.params.id);

        if (!puzzle) {
            return res.status(404).json({ success: false, message: 'Puzzle not found' });
        }

        // If already solved, don't fail it
        if (puzzle.status === 'solved') {
            return res.status(400).json({ success: false, message: 'Puzzle already solved' });
        }

        // Mark as failed
        puzzle.status = 'failed';
        await puzzle.save();
        
        let newTotalPoints = req.user ? req.user.points : 0;
        let pointsReceived = false;

        if (req.user) {
            const list = await GroceryList.findOne({
                'items.puzzle': puzzle._id
            }).populate('items.puzzle');

            if (list) {
                const isFinished = list.items.every(item =>
                    item.puzzle && (item.puzzle.status === 'solved' || item.puzzle.status === 'failed')
                );

                if (isFinished && !list.pointsAwarded) {
                    list.pointsAwarded = true;
                    await list.save();

                    const totalItems = list.items.length;
                    const solvedItems = list.items.filter(item => item.puzzle && item.puzzle.status === 'solved').length;
                    
                    let calculatedPoints = (solvedItems * 50) + (totalItems * 10);
                    if (totalItems > 0 && solvedItems === totalItems) {
                        calculatedPoints += 250; 
                    }
                    if (calculatedPoints === 0) calculatedPoints = 5;

                    req.user.points = (req.user.points || 0) + calculatedPoints;
                    await req.user.save();

                    await Leaderboard.findOneAndUpdate(
                        { user: req.user._id },
                        {
                            $set: {
                                username: req.user.username,
                                totalPoints: req.user.points,
                                lastUpdated: Date.now()
                            }
                        },
                        { upsert: true, new: true }
                    );

                    pointsReceived = calculatedPoints;
                    newTotalPoints = req.user.points;
                }
            }
        }

        res.status(200).json({ success: true, data: puzzle, pointsReceived, newTotalPoints });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
