require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

require('./db/database'); // initialise la BDD (tables + utilisateur de test)

const gamesRoutes = require('./routes/games.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const authRoutes = require('./routes/auth.routes');
const communityRoutes = require('./routes/community.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions (cookie signé). Le frontend étant servi par ce serveur,
// le cookie est en same-origin : pas de config CORS particulière.
app.use(session({
  secret: process.env.SESSION_SECRET || 'nextdrop-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
  },
}));

// API.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api/games', gamesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/community', communityRoutes);

// Images uploadées et frontend statique.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Gestionnaire d'erreurs centralisé (gère aussi les erreurs multer).
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.message && err.message.includes('image') ? 400 : 500);
  res.status(status).json({ error: err.message || 'Erreur interne du serveur.' });
});

app.listen(PORT, () => {
  console.log(`API NextDrop démarrée sur http://localhost:${PORT}`);
});
