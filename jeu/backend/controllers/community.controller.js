// Controller communauté : jeux ajoutés par les utilisateurs + commentaires.
const db = require('../db/database');

// GET /api/community/games  → liste des jeux (avec auteur + nb de commentaires)
function listGames(req, res) {
  const games = db.prepare(`
    SELECT j.id_jeu        AS id,
           j.titre         AS titre,
           j.description   AS description,
           j.image         AS image,
           j.date_ajout    AS date_ajout,
           u.pseudo        AS auteur,
           (SELECT COUNT(*) FROM commentaire c WHERE c.id_jeu = j.id_jeu) AS nb_commentaires
    FROM jeu j
    JOIN utilisateur u ON u.id_utilisateur = j.id_utilisateur
    ORDER BY j.date_ajout DESC
  `).all();

  res.json(games);
}

// GET /api/community/games/:id  → détail d'un jeu + ses commentaires
function getGame(req, res) {
  const game = db.prepare(`
    SELECT j.id_jeu      AS id,
           j.titre       AS titre,
           j.description AS description,
           j.image       AS image,
           j.date_ajout  AS date_ajout,
           u.pseudo      AS auteur
    FROM jeu j
    JOIN utilisateur u ON u.id_utilisateur = j.id_utilisateur
    WHERE j.id_jeu = ?
  `).get(req.params.id);

  if (!game) {
    return res.status(404).json({ error: 'Jeu introuvable.' });
  }

  const comments = db.prepare(`
    SELECT c.id_commentaire AS id,
           c.contenu        AS contenu,
           c.date_creation  AS date_creation,
           u.pseudo         AS auteur
    FROM commentaire c
    JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
    WHERE c.id_jeu = ?
    ORDER BY c.date_creation ASC
  `).all(req.params.id);

  res.json({ ...game, comments });
}

// POST /api/community/games  (protégé) — image optionnelle
function addGame(req, res) {
  const body = req.body || {};
  const titre = (body.titre || '').trim();
  const description = (body.description || '').trim();

  if (!titre || !description) {
    return res.status(400).json({ error: 'Le titre et la description sont obligatoires.' });
  }

  // L'image est facultative.
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const info = db.prepare(`
    INSERT INTO jeu (titre, description, image, id_utilisateur)
    VALUES (?, ?, ?, ?)
  `).run(titre, description, image, req.session.user.id);

  const game = db.prepare(`
    SELECT j.id_jeu AS id, j.titre, j.description, j.image, j.date_ajout,
           u.pseudo AS auteur, 0 AS nb_commentaires
    FROM jeu j JOIN utilisateur u ON u.id_utilisateur = j.id_utilisateur
    WHERE j.id_jeu = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(game);
}

// POST /api/community/games/:id/comments  (protégé)
function addComment(req, res) {
  const contenu = ((req.body || {}).contenu || '').trim();
  if (!contenu) {
    return res.status(400).json({ error: 'Le commentaire ne peut pas être vide.' });
  }

  const game = db.prepare('SELECT id_jeu FROM jeu WHERE id_jeu = ?').get(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Jeu introuvable.' });
  }

  const info = db.prepare(`
    INSERT INTO commentaire (contenu, id_utilisateur, id_jeu)
    VALUES (?, ?, ?)
  `).run(contenu, req.session.user.id, req.params.id);

  const comment = db.prepare(`
    SELECT c.id_commentaire AS id, c.contenu, c.date_creation, u.pseudo AS auteur
    FROM commentaire c JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
    WHERE c.id_commentaire = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(comment);
}

module.exports = { listGames, getGame, addGame, addComment };
