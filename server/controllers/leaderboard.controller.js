const Leaderboard = require('../models/Leaderboard');

// @desc    Get leaderboard rankings
// @route   GET /api/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
    try {
        // Find top users sorted by points (desc) and then by lastUpdated (asc) for tie-breaking
        const leaderboard = await Leaderboard.find()
            .sort({ totalPoints: -1, lastUpdated: 1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: leaderboard.length,
            data: leaderboard
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
