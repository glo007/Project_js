const express = require('express');
const { getGames } = require('../controllers/games.controller');

const router = express.Router();

// GET /api/games
router.get('/', getGames);

module.exports = router;
