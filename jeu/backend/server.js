require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const gamesRoutes = require('./routes/games.routes');
const favoritesRoutes = require('./routes/favorites.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux.
app.use(cors());
app.use(express.json());

// API.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api/games', gamesRoutes);
app.use('/api/favorites', favoritesRoutes);

// Sert le frontend statique (http://localhost:PORT).
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Gestionnaire d'erreurs centralisé (Express 5 transmet les rejets async ici).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

app.listen(PORT, () => {
  console.log(`API NextDrop démarrée sur http://localhost:${PORT}`);
});
