// Page liste : affiche tous les jeux de la communauté.
renderAuthNav();
loadGames();

async function loadGames() {
  const list = document.getElementById('community-list');
  try {
    const games = await api('/community/games');
    if (games.length === 0) {
      list.innerHTML = '<p class="no-result">Aucun jeu pour le moment. Connectez-vous pour en ajouter !</p>';
      return;
    }
    list.innerHTML = games.map(cardHtml).join('');
  } catch {
    list.innerHTML = '<p class="no-result">Impossible de charger les jeux.</p>';
  }
}

function cardHtml(game) {
  const img = game.image
    ? `<img src="${esc(game.image)}" alt="${esc(game.titre)}" class="project-img" />`
    : `<div class="project-img no-img">🎮</div>`;
  return `
    <li class="jeu">
      <a class="jeu-link" href="./jeu.html?id=${game.id}">
        <figure class="jeu-card">
          ${img}
          <figcaption class="project-info">
            <h3>${esc(game.titre)}</h3>
            <p class="gm-author">par ${esc(game.auteur)}</p>
          </figcaption>
          <div class="card-genres">
            <span class="genre-pill">💬 ${game.nb_commentaires}</span>
          </div>
        </figure>
      </a>
    </li>`;
}
