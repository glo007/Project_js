const express = require('express');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favorites.controller');

const router = express.Router();

// GET    /api/favorites
// POST   /api/favorites
// DELETE /api/favorites/:id
router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:id', removeFavorite);

module.exports = router;
