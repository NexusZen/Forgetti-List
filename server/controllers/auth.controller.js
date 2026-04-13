const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const Puzzle = require('../models/Puzzle');

// Helper to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    // Get puzzle stats
    const puzzlesSolved = await Puzzle.countDocuments({ user: user._id, status: 'solved' });

    res.status(statusCode).json({
        success: true,
        token,
        data: {
            _id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            points: user.points || 0,
            avatarUrl: user.avatarUrl || null,
            puzzlesSolved
        }
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create new user (password hashing is handled in pre-save hook)
        user = await User.create({
            username,
            email,
            password
        });

        // Initialize Leaderboard
        await Leaderboard.create({
            user: user._id,
            username: user.username,
            totalPoints: 0
        });

        await sendTokenResponse(user, 201, res);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        await sendTokenResponse(user, 200, res);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    const puzzlesSolved = await Puzzle.countDocuments({ user: req.user._id, status: 'solved' });

    const user = req.user.toObject();
    user.puzzlesSolved = puzzlesSolved;

    res.status(200).json({
        success: true,
        data: user
    });
};

// @desc    Get user dashboard stats
// @route   GET /api/auth/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const daysParam = parseInt(req.query.days) || 14;

        // Puzzles solved and failed
        const puzzlesSolved = await Puzzle.countDocuments({ user: userId, status: 'solved' });
        const puzzlesFailed = await Puzzle.countDocuments({ user: userId, status: 'failed' });

        // Best rank — count users with more points + 1
        const userLeaderboard = await Leaderboard.findOne({ user: userId });
        let bestRank = null;
        if (userLeaderboard && userLeaderboard.totalPoints > 0) {
            const higherRanked = await Leaderboard.countDocuments({
                totalPoints: { $gt: userLeaderboard.totalPoints }
            });
            bestRank = higherRanked + 1;
        }

        // Total leaderboard users
        const totalUsers = await Leaderboard.countDocuments();

        // Activity data — puzzles solved per day for the last N days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (daysParam - 1));
        startDate.setHours(0, 0, 0, 0);

        const activityData = await Puzzle.aggregate([
            {
                $match: {
                    user: userId,
                    status: 'solved',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Fill in missing days with 0
        const days = [];
        for (let i = 0; i < daysParam; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const found = activityData.find(d => d._id === dateStr);
            days.push({
                date: dateStr,
                day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                count: found ? found.count : 0
            });
        }

        res.status(200).json({
            success: true,
            data: {
                puzzlesSolved,
                puzzlesFailed,
                bestRank,
                totalUsers,
                activityDays: days
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update user avatar
// @route   PATCH /api/auth/avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatarUrl: req.file.path },
            { new: true }
        );

        res.status(200).json({
            success: true,
            avatarUrl: user.avatarUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
