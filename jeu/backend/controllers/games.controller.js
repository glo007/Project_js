// Controller jeux : proxy vers l'API RAWG.
// La clé API reste côté serveur (jamais exposée au navigateur).

const RAWG_BASE_URL = 'https://api.rawg.io/api/games';

// Mots-clés bloquant les contenus à caractère sexuel.
const SEXUAL_KEYWORDS = [
  'sexual', 'sex', 'nudity', 'erotic', 'hentai',
  'porn', 'nsfw', 'ecchi', 'adult', 'mature',
];

function isSexualContent(game) {
  const allText = `
    ${game.name || ''}
    ${game.description_raw || ''}
    ${(game.tags || []).map((tag) => tag.name).join(' ')}
    ${(game.genres || []).map((genre) => genre.name).join(' ')}
    ${game.esrb_rating?.name || ''}
  `.toLowerCase();

  return SEXUAL_KEYWORDS.some((keyword) => allText.includes(keyword));
}

// Plage de dates correspondant au mois courant (jeux du mois).
function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  // Dernier jour réel du mois (gère 28/29/30/31).
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

// GET /api/games?search=&platforms=&page_size=
async function getGames(req, res) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RAWG_API_KEY manquante côté serveur.' });
  }

  const { search = '', platforms = '' } = req.query;
  const pageSize = Number(req.query.page_size) || 10;
  const { start, end } = currentMonthRange();

  const params = new URLSearchParams({
    key: apiKey,
    dates: `${start},${end}`,
    ordering: 'released',
    page_size: String(pageSize),
  });
  if (search) params.set('search', search);
  if (platforms) params.set('platforms', platforms);

  const listResponse = await fetch(`${RAWG_BASE_URL}?${params.toString()}`);
  if (!listResponse.ok) {
    return res.status(502).json({ error: 'Erreur lors de la requête vers RAWG.' });
  }
  const data = await listResponse.json();
  const results = Array.isArray(data.results) ? data.results : [];

  // Enrichissement avec la description détaillée (description_raw).
  const detailedGames = await Promise.all(
    results.map(async (game) => {
      try {
        const detailParams = new URLSearchParams({ key: apiKey, locale: 'fr' });
        const res2 = await fetch(`${RAWG_BASE_URL}/${game.id}?${detailParams.toString()}`);
        if (!res2.ok) return game;
        const detail = await res2.json();
        return { ...game, description_raw: detail.description_raw };
      } catch {
        return game;
      }
    }),
  );

  // Filtrage des contenus inappropriés puis normalisation du payload :
  // on ne renvoie que les champs utiles à l'interface (objet RAWG brut = lourd).
  const games = detailedGames
    .filter((game) => !isSexualContent(game))
    .map(normalizeGame);

  return res.json(games);
}

// Réduit l'objet RAWG aux champs consommés par le frontend.
function normalizeGame(game) {
  return {
    id: game.id,
    slug: game.slug,
    name: game.name,
    released: game.released || '',
    background_image: game.background_image || '',
    rating: game.rating || 0,          // note communautaire RAWG (0–5)
    rating_top: game.rating_top || 5,
    metacritic: game.metacritic ?? null, // score Metacritic (0–100) ou null
    genres: (game.genres || []).map((g) => ({ name: g.name })),
    tags: (game.tags || []).map((t) => ({ name: t.name })),
    parent_platforms: game.parent_platforms || [],
    esrb_rating: game.esrb_rating || null,
    description_raw: game.description_raw || '',
  };
}

module.exports = { getGames };
