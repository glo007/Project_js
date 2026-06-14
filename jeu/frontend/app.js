// Base de l'API backend (proxy RAWG + favoris).
// La clé RAWG vit désormais côté serveur, plus dans le navigateur.
const API_BASE = 'http://localhost:3000/api';

// Menu burger
function toggleMenu() {
  const navbar = document.querySelector('.navbar');
  const burger = document.querySelector('.burger');

  burger.addEventListener('click', () => {
    navbar.classList.toggle('show-nav');
  });

  const navbarLinks = document.querySelectorAll('.navbar a');
  navbarLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('show-nav');
    });
  });
}
toggleMenu();

// Changement du titre de plateforme
function changeTitle() {
  const navbarLinks = document.querySelectorAll('.navbar__links a');
  const platformTitle = document.querySelector('.platform-title');

  navbarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      platformTitle.textContent = link.textContent;
    });
  });
}
changeTitle();

// Logos solo multi plateformes pour modale
const techLogos = {
  solo: './asset/sologame.svg',
  multi: './asset/multiplayer.svg',
  xbox: './asset/xbox.svg',
  nintendo: './asset/nintendo-switch.svg',
  pc: './asset/pc.svg',
  playstation: './asset/playstation.svg',
};

const searchInput = document.querySelector('.barrecherche input');
const searchBtn = document.querySelector('.barrecherche button');
const gameList = document.querySelector('main section ul');
const navbarLinks = document.querySelectorAll('.navbar__links a');

// Identifiants des jeux favoris (chargés depuis le backend).
let favoriteIds = new Set();

// Chargement initial : favoris puis jeux du mois.
window.addEventListener('DOMContentLoaded', async () => {
  await loadFavorites();
  const games = await fetchGames({});
  displayGames(games);
});

// Filtrage par plateforme / accès aux favoris
navbarLinks.forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const label = link.textContent.trim().toLowerCase();

    if (label === 'favoris') {
      const favorites = await fetchFavorites();
      displayGames(favorites);
      return;
    }

    const platformId = getPlatformId(label);
    if (platformId) {
      const games = await fetchGames({ platforms: platformId });
      displayGames(games);
    }
  });
});

// Recherche de jeux (bouton)
searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (query.length < 2) return;
  const games = await fetchGames({ search: query });
  displayGames(games);
  searchInput.value = '';
});

// Validation de la recherche avec la touche Entrée
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query.length < 2) return;
    const games = await fetchGames({ search: query });
    displayGames(games);
    searchInput.value = '';
  }
});

// Recherche automatique dès 2 caractères (sans reset ici)
searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();
  if (query.length >= 2) {
    const games = await fetchGames({ search: query });
    displayGames(games);
  }
});

// Correspondances nom à l'ID plateformes
function getPlatformId(name) {
  const platforms = {
    playstation: 18,
    xbox: 1,
    nintendo: 7,
    pc: 4
  };
  return platforms[name.toLowerCase()];
}

// Requête vers le backend pour récupérer les jeux
async function fetchGames({ search = '', platforms = '' }) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (platforms) params.set('platforms', platforms);

  try {
    const response = await fetch(`${API_BASE}/games?${params.toString()}`);
    if (!response.ok) return [];
    const games = await response.json();
    return Array.isArray(games) ? games : [];
  } catch {
    return [];
  }
}

// --- Favoris -----------------------------------------------------------

async function loadFavorites() {
  const favorites = await fetchFavorites();
  favoriteIds = new Set(favorites.map(fav => String(fav.id)));
}

async function fetchFavorites() {
  try {
    const response = await fetch(`${API_BASE}/favorites`);
    if (!response.ok) return [];
    const favorites = await response.json();
    return Array.isArray(favorites) ? favorites : [];
  } catch {
    return [];
  }
}

async function addFavorite(game) {
  const response = await fetch(`${API_BASE}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  });
  if (response.ok || response.status === 409) {
    favoriteIds.add(String(game.id));
  }
}

async function removeFavorite(id) {
  const response = await fetch(`${API_BASE}/favorites/${id}`, { method: 'DELETE' });
  if (response.ok || response.status === 404) {
    favoriteIds.delete(String(id));
  }
}

// --- Affichage ---------------------------------------------------------

// Blocage des contenus à caractère sexuel (double sécurité avec le backend).
function isSexualContent(game) {
  const sexualKeywords = ['sexual', 'sex', 'nudity', 'erotic', 'hentai', 'porn', 'nsfw', 'ecchi', 'adult', 'mature'];

  const allText = `
    ${game.name || ''}
    ${game.description_raw || ''}
    ${(game.tags || []).map(tag => tag.name).join(' ')}
    ${(game.genres || []).map(genre => genre.name).join(' ')}
    ${(game.esrb_rating?.name || '')}
  `.toLowerCase();

  return sexualKeywords.some(keyword => allText.includes(keyword));
}

// Badge note communautaire + Metacritic
function buildMeta(game) {
  const parts = [];

  if (game.rating) {
    parts.push(`<span class="card-rating">★ ${Number(game.rating).toFixed(1)}</span>`);
  }

  if (game.metacritic) {
    const m = Number(game.metacritic);
    const level = m >= 75 ? '' : m >= 50 ? ' is-mid' : ' is-low';
    parts.push(`<span class="card-metacritic${level}">MC ${m}</span>`);
  }

  return parts.length ? `<div class="card-meta">${parts.join('')}</div>` : '';
}

// Pastilles de genres (max 3)
function buildGenres(game) {
  const genres = (game.genres || []).slice(0, 3);
  if (genres.length === 0) return '';
  const pills = genres.map(g => `<span class="genre-pill">${g.name}</span>`).join('');
  return `<div class="card-genres">${pills}</div>`;
}

// Affichage des jeux dans la liste HTML
function displayGames(games) {
  gameList.innerHTML = '';

  const filteredGames = games.filter(game => !isSexualContent(game));

  if (filteredGames.length === 0) {
    gameList.innerHTML = '<p class="no-result">Aucun jeu approprié trouvé ce mois-ci.</p>';
    return;
  }

  filteredGames.forEach((game, index) => {
    const li = document.createElement('li');
    li.classList.add('jeu');

    const figure = document.createElement('figure');
    figure.classList.add(`jeu${index + 1}`, 'jeu-card');

    const number = `<div class="number" role="region" aria-labelledby="number_${index + 1}">
                      <strong id="number_${index + 1}">${index + 1}</strong>
                    </div>`;

    const isFav = favoriteIds.has(String(game.id));
    const favBtn = `<button type="button" class="fav-btn${isFav ? ' is-fav' : ''}"
                      data-id="${game.id}"
                      aria-label="Ajouter aux favoris"
                      aria-pressed="${isFav}">${isFav ? '★' : '☆'}</button>`;

    const image = `<img src="${game.background_image}" alt="${game.name}" class="project-img"/>`;

    const caption = `<figcaption class="project-info">
                      <h3>${game.name}</h3>
                      <p><time datetime="${game.released}">${game.released ? new Date(game.released).toLocaleDateString('fr-FR') : ''}</time></p>
                      ${buildMeta(game)}
                    </figcaption>`;

    const genres = buildGenres(game);

    const tech = (game.tags || []).some(t => t.name.toLowerCase().includes('multiplayer')) ? 'MULTI' : 'SOLO';

    const desc = game.description_raw ? game.description_raw : 'Description non disponible ici. ';

    const platforms = (game.parent_platforms || []).map(p => p.platform.name.toLowerCase()).join(',');

    const dataDiv = `<div class="project-jeu"
                      data-img="${game.background_image}"
                      data-title="${game.name}"
                      data-desc="${desc}"
                      data-tech="${tech}"
                      data-platforms="${platforms}">
                    </div>`;

    figure.innerHTML = number + favBtn + image + caption + genres + dataDiv;

    // Données minimales pour enregistrer le favori.
    const btn = figure.querySelector('.fav-btn');
    btn._game = {
      id: game.id,
      name: game.name,
      background_image: game.background_image,
      released: game.released,
    };

    li.appendChild(figure);
    gameList.appendChild(li);
  });

  attachFavoriteEvents();
  attachModalEvents(); // Lier les jeux à la modale
}

// Gérer le clic sur le bouton favori
function attachFavoriteEvents() {
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // ne pas ouvrir la modale
      const id = btn.dataset.id;
      const active = favoriteIds.has(String(id));

      if (active) {
        await removeFavorite(id);
      } else {
        await addFavorite(btn._game);
      }

      const nowFav = favoriteIds.has(String(id));
      btn.classList.toggle('is-fav', nowFav);
      btn.setAttribute('aria-pressed', String(nowFav));
      btn.textContent = nowFav ? '★' : '☆';
    });
  });
}

// Gérer l'ouverture de la modale
function attachModalEvents() {
  document.querySelectorAll('.jeu').forEach(jeuEl => {
    jeuEl.addEventListener('click', () => {
      const dataDiv = jeuEl.querySelector('.project-jeu');
      if (!dataDiv) return;

      const imgsrc = dataDiv.getAttribute('data-img');
      const desc = dataDiv.getAttribute('data-desc');
      const title = dataDiv.getAttribute('data-title');
      const tech = dataDiv.getAttribute('data-tech')?.split(',') || [];
      const platforms = dataDiv.getAttribute('data-platforms')?.split(',') || [];

      document.getElementById('modal-img').src = imgsrc;
      document.getElementById('modal-title').innerText = title;
      document.getElementById('modal-desc').innerText = desc;

      const techsDiv = document.getElementById('modal-tech');
      techsDiv.innerHTML = '';

      // Type SOLO ou MULTI
      tech.forEach(t => {
        const key = t.trim().toLowerCase();
        if (techLogos[key]) {
          const img = document.createElement('img');
          img.src = techLogos[key];
          img.alt = key;
          img.title = key;
          techsDiv.appendChild(img);
        }
      });

      // Types de plateformes
      platforms.forEach(p => {
        const key = p.trim().toLowerCase();
        if (techLogos[key]) {
          const img = document.createElement('img');
          img.src = techLogos[key];
          img.alt = key;
          img.title = key;
          techsDiv.appendChild(img);
        }
      });

      document.getElementById('project-modal').style.display = 'flex';
    });
  });
}

// Fermer la modale
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('project-modal').style.display = 'none';
  });

  document.getElementById('project-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      document.getElementById('project-modal').style.display = 'none';
    }
  });
});
