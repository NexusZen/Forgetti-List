const express = require('express');
const router = express.Router();
const { getGroceryLists, createGroceryList, deleteGroceryList, updateGroceryList } = require('../controllers/grocery.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

router.route('/')
    .get(getGroceryLists)
    .post(createGroceryList);

router.route('/:id')
    .put(updateGroceryList)
    .delete(deleteGroceryList);

module.exports = router;
