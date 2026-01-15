const express = require('express');
const router = express.Router();
const { verifyGuess, getPuzzle, updatePuzzleType } = require('../controllers/puzzle.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/:puzzleId/verify', protect, verifyGuess);
router.get('/:id', protect, getPuzzle);
router.put('/:id/type', protect, updatePuzzleType);

module.exports = router;
