const express = require('express');
const router = express.Router();
const { verifyGuess, getPuzzle, updatePuzzleType, failPuzzle } = require('../controllers/puzzle.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/:puzzleId/verify', protect, verifyGuess);
router.get('/:id', protect, getPuzzle);
router.put('/:id/type', protect, updatePuzzleType);
router.post('/:id/fail', protect, failPuzzle);

module.exports = router;
