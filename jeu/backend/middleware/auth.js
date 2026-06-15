// Middleware : bloque l'accès aux routes protégées si non connecté.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Vous devez être connecté.' });
  }
  next();
}

module.exports = { requireAuth };
