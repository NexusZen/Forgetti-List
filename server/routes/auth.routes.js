const express = require('express');
const { register, login, getMe, updateAvatar } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
