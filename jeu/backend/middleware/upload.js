// Middleware d'upload d'image (multer). L'image reste optionnelle.
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

// On n'accepte que les images, taille max 3 Mo.
function fileFilter(req, file, cb) {
  if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format d\'image non supporté (png, jpg, webp, gif).'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

module.exports = upload;
