// Base de données SQLite (intégrée à Node 24 via node:sqlite — aucune dépendance native).
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'nextdrop.db');
const db = new DatabaseSync(DB_PATH);

// Respect des clés étrangères (désactivé par défaut dans SQLite).
db.exec('PRAGMA foreign_keys = ON');

// ----- Schéma (Modèle Logique de Données) -----
db.exec(`
  CREATE TABLE IF NOT EXISTS utilisateur (
    id_utilisateur   INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo           TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    mot_de_passe     TEXT NOT NULL,
    role             TEXT NOT NULL DEFAULT 'membre',
    date_inscription TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jeu (
    id_jeu         INTEGER PRIMARY KEY AUTOINCREMENT,
    titre          TEXT NOT NULL,
    description    TEXT NOT NULL,
    image          TEXT,
    date_ajout     TEXT NOT NULL DEFAULT (datetime('now')),
    id_utilisateur INTEGER NOT NULL,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS commentaire (
    id_commentaire INTEGER PRIMARY KEY AUTOINCREMENT,
    contenu        TEXT NOT NULL,
    date_creation  TEXT NOT NULL DEFAULT (datetime('now')),
    id_utilisateur INTEGER NOT NULL,
    id_jeu         INTEGER NOT NULL,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (id_jeu)         REFERENCES jeu(id_jeu)                 ON DELETE CASCADE
  );
`);

// ----- Jeu de données de test -----
// Utilisateur de test pré-implémenté pour pouvoir se connecter immédiatement.
function seed() {
  const TEST_EMAIL = 'test@nextdrop.fr';
  const existing = db
    .prepare('SELECT id_utilisateur FROM utilisateur WHERE email = ?')
    .get(TEST_EMAIL);

  let userId = existing?.id_utilisateur;
  if (!existing) {
    const hash = bcrypt.hashSync('test1234', 10);
    const info = db.prepare(
      'INSERT INTO utilisateur (pseudo, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
    ).run('Testeur', TEST_EMAIL, hash, 'admin');
    userId = info.lastInsertRowid;
    console.log(`Utilisateur de test créé : ${TEST_EMAIL} / test1234`);
  }

  // Un jeu d'exemple (uniquement si la table est vide) pour ne pas avoir
  // une page Communauté vide à la première ouverture.
  const gameCount = db.prepare('SELECT COUNT(*) AS n FROM jeu').get().n;
  if (gameCount === 0) {
    const info = db.prepare(
      'INSERT INTO jeu (titre, description, image, id_utilisateur) VALUES (?, ?, ?, ?)',
    ).run(
      'Hollow Knight: Silksong',
      "Suite très attendue de Hollow Knight : on incarne Hornet dans un nouveau royaume, dans un metroidvania exigeant et magnifique.",
      null,
      userId,
    );
    db.prepare(
      'INSERT INTO commentaire (contenu, id_utilisateur, id_jeu) VALUES (?, ?, ?)',
    ).run('Hâte de pouvoir y jouer !', userId, info.lastInsertRowid);
  }
}
seed();

module.exports = db;
