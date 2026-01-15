const Puzzle = require('../models/Puzzle');

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
    const { guess, status } = req.body; // status used for word_grid

    try {
        const puzzle = await Puzzle.findById(puzzleId);

        if (!puzzle) {
            return res.status(404).json({ success: false, message: 'Puzzle not found' });
        }

        if (puzzle.status === 'solved' || puzzle.status === 'failed') {
            return res.status(400).json({ success: false, message: 'Puzzle already completed' });
        }

        // --- WORD GRID LOGIC ---
        if (puzzle.type === 'word_grid') {
            if (status === 'solved') {
                puzzle.status = 'solved';
                await puzzle.save();
                return res.status(200).json({ success: true, status: 'solved' });
            } else if (status === 'failed') {
                puzzle.status = 'failed';
                await puzzle.save();
                return res.status(200).json({ success: true, status: 'failed' });
            }
            return res.status(400).json({ success: false, message: 'Invalid status for Word Grid' });
        }

        // --- WORDLE LOGIC ---
        if (puzzle.attempts >= puzzle.maxAttempts) {
            puzzle.status = 'failed';
            await puzzle.save();
            return res.status(200).json({ success: false, message: 'Max attempts reached', status: 'failed' });
        }

        const targetWord = puzzle.groceryItemName.trim().toUpperCase();
        const userGuess = guess.trim().toUpperCase();

        if (userGuess.length !== targetWord.length) {
            return res.status(400).json({ success: false, message: `Guess must be ${targetWord.length} letters long` });
        }

        const result = new Array(targetWord.length).fill(null).map(() => ({ letter: '', status: 'absent' }));
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

        await puzzle.save();

        res.status(200).json({
            success: true,
            status: puzzle.status,
            result: result,
            remainingAttempts: puzzle.maxAttempts - puzzle.attempts,
            solution: (puzzle.status === 'failed' || puzzle.status === 'solved') ? targetWord : undefined
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
