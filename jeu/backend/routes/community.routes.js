const express = require('express');
const { listGames, getGame, addGame, addComment } = require('../controllers/community.controller');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Lecture publique
router.get('/games', listGames);
router.get('/games/:id', getGame);

// Écriture réservée aux utilisateurs connectés
router.post('/games', requireAuth, upload.single('image'), addGame);
router.post('/games/:id/comments', requireAuth, addComment);

module.exports = router;
