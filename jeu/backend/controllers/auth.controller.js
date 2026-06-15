// Controller authentification : inscription, connexion, déconnexion, profil.
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Construit l'objet utilisateur stocké en session (sans le mot de passe).
function publicUser(row) {
  return {
    id: row.id_utilisateur,
    pseudo: row.pseudo,
    email: row.email,
    role: row.role,
  };
}

// POST /api/auth/register  (bonus)
function register(req, res) {
  const body = req.body || {};
  const pseudo = (body.pseudo || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const motDePasse = body.mot_de_passe || '';

  if (!pseudo || !email || !motDePasse) {
    return res.status(400).json({ error: 'Pseudo, email et mot de passe sont requis.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Email invalide.' });
  }
  if (motDePasse.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères.' });
  }

  const exists = db.prepare('SELECT id_utilisateur FROM utilisateur WHERE email = ?').get(email);
  if (exists) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  }

  const hash = bcrypt.hashSync(motDePasse, 10);
  const info = db
    .prepare('INSERT INTO utilisateur (pseudo, email, mot_de_passe) VALUES (?, ?, ?)')
    .run(pseudo, email, hash);

  const row = db
    .prepare('SELECT * FROM utilisateur WHERE id_utilisateur = ?')
    .get(info.lastInsertRowid);

  // Connexion automatique après inscription.
  req.session.user = publicUser(row);
  res.status(201).json({ user: req.session.user });
}

// POST /api/auth/login
function login(req, res) {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const motDePasse = body.mot_de_passe || '';

  if (!email || !motDePasse) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const row = db.prepare('SELECT * FROM utilisateur WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(motDePasse, row.mot_de_passe)) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  req.session.user = publicUser(row);
  res.json({ user: req.session.user });
}

// POST /api/auth/logout
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
}

// GET /api/auth/me  → renvoie l'utilisateur connecté (ou null)
function me(req, res) {
  res.json({ user: req.session.user || null });
}

module.exports = { register, login, logout, me };
