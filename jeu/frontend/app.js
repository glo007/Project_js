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

// Fonctions API RAWG
const apiKey = '637c061e6c0b4d3da8d4c60d0fc0e466';
const baseUrl = 'https://api.rawg.io/api/games';

const searchInput = document.querySelector('.barrecherche input');
const searchBtn = document.querySelector('.barrecherche button');
const gameList = document.querySelector('main section ul');
const navbarLinks = document.querySelectorAll('.navbar__links a');

// Chargement initial des jeux du mois
window.addEventListener('DOMContentLoaded', async () => {// Chargement des jeux du mois
  const games = await fetchGames({});// Requête sans filtre pour obtenir les jeux du mois
  displayGames(games);// Affichage des jeux dans la liste
});

// Filtrage par plateforme
navbarLinks.forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const platform = link.textContent.trim().toLowerCase();
    const platformId = getPlatformId(platform);
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

// Validation de la recherche avec la touche enter
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query.length < 2) return;
    const games = await fetchGames({ search: query });
    displayGames(games);
    searchInput.value = ''; // Réinitialiser le champ après validation
  }
});


  
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

// Requête vers l'API pour récupérer les jeux
async function fetchGames({ search = '', platforms = '' }) {
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

  const url = `${baseUrl}?key=${apiKey}&dates=${startDate},${endDate}&ordering=released&page_size=10${
    search ? `&search=${encodeURIComponent(search)}` : ''
  }${platforms ? `&platforms=${platforms}` : ''}`;

  const response = await fetch(url);
  const data = await response.json();

  const detailedGames = await Promise.all(
    data.results.map(async game => {
      try {
        const res = await fetch(`${baseUrl}/${game.id}?key=${apiKey}&locale=fr`);
        const detail = await res.json();
        return { ...game, description_raw: detail.description_raw };
      } catch {
        return game;
      }
    })
  );

  return detailedGames;
}

// Blocage des jeux de cul mystiques
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
    figure.classList.add(`jeu${index + 1}`);

    const number = `<div class="number" role="region" aria-labelledby="number_${index + 1}">
                      <strong id="number_${index + 1}">${index + 1}</strong>
                    </div>`;

    const image = `<img src="${game.background_image}" alt="${game.name}" class="project-img"/>`;

    const caption = `<figcaption class="project-info">
                      <h3>${game.name}</h3>
                      <p><time datetime="${game.released}">${new Date(game.released).toLocaleDateString('fr-FR')}</time></p>
                    </figcaption>`;

    const tech = game.tags.some(t => t.name.toLowerCase().includes('multiplayer')) ? 'MULTI' : 'SOLO';

    const desc = game.description_raw ? game.description_raw : 'Description non disponible ici. ';

    const platforms = (game.parent_platforms || []).map(p => p.platform.name.toLowerCase()).join(',');

    const dataDiv = `<div class="project-jeu"
                      data-img="${game.background_image}"
                      data-title="${game.name}"
                      data-desc="${desc}"
                      data-tech="${tech}"
                      data-platforms="${platforms}">
                    </div>`;

    figure.innerHTML = number + image + caption + dataDiv;
    li.appendChild(figure);
    gameList.appendChild(li);
  });

  attachModalEvents(); // Lier les jeux à la modale
}

// Gérer l’ouverture de la modale
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

      // Type SOLOou MULTI
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

      // types de Plateformes
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

