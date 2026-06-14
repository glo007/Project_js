// Controller favoris : persistance simple dans data/favorites.json.

const fs = require('fs/promises');
const path = require('path');

const FAVORITES_FILE = path.join(__dirname, '..', 'data', 'favorites.json');

async function readFavorites() {
  try {
    const raw = await fs.readFile(FAVORITES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // Fichier absent ou vide/corrompu : on repart d'une liste vide.
    if (err.code === 'ENOENT' || err instanceof SyntaxError) return [];
    throw err;
  }
}

async function writeFavorites(favorites) {
  await fs.mkdir(path.dirname(FAVORITES_FILE), { recursive: true });
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf-8');
}

// GET /api/favorites
async function getFavorites(req, res) {
  const favorites = await readFavorites();
  res.json(favorites);
}

// POST /api/favorites  (body = objet jeu, doit contenir un id)
async function addFavorite(req, res) {
  const game = req.body;
  if (!game || game.id === undefined || game.id === null) {
    return res.status(400).json({ error: 'Un identifiant de jeu (id) est requis.' });
  }

  const favorites = await readFavorites();
  if (favorites.some((fav) => String(fav.id) === String(game.id))) {
    return res.status(409).json({ error: 'Ce jeu est déjà dans les favoris.', favorites });
  }

  // On ne garde que les champs utiles à l'affichage.
  const entry = {
    id: game.id,
    name: game.name || '',
    background_image: game.background_image || '',
    released: game.released || '',
    addedAt: new Date().toISOString(),
  };
  favorites.push(entry);
  await writeFavorites(favorites);
  res.status(201).json(favorites);
}

// DELETE /api/favorites/:id
async function removeFavorite(req, res) {
  const { id } = req.params;
  const favorites = await readFavorites();
  const next = favorites.filter((fav) => String(fav.id) !== String(id));

  if (next.length === favorites.length) {
    return res.status(404).json({ error: 'Favori introuvable.', favorites });
  }

  await writeFavorites(next);
  res.json(next);
}

module.exports = { getFavorites, addFavorite, removeFavorite };
