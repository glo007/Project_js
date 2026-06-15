// Page détail d'un jeu + commentaires.
const gameId = new URLSearchParams(window.location.search).get('id');

(async function init() {
  const user = await renderAuthNav();

  if (!gameId) {
    document.getElementById('game-detail').innerHTML = '<p class="no-result">Jeu introuvable.</p>';
    return;
  }

  await loadGame();
  setupCommentForm(user);
})();

async function loadGame() {
  try {
    const game = await api(`/community/games/${gameId}`);
    renderGame(game);
    renderComments(game.comments);
  } catch (err) {
    document.getElementById('game-detail').innerHTML = `<p class="no-result">${esc(err.message)}</p>`;
  }
}

function renderGame(game) {
  const img = game.image
    ? `<img src="${esc(game.image)}" alt="${esc(game.titre)}" class="detail-img" />`
    : `<div class="detail-img no-img">🎮</div>`;

  document.getElementById('game-detail').innerHTML = `
    ${img}
    <div class="detail-body">
      <h2 class="detail-title">${esc(game.titre)}</h2>
      <p class="gm-author">par ${esc(game.auteur)} · ${fmtDate(game.date_ajout)}</p>
      <p class="detail-desc">${esc(game.description)}</p>
    </div>`;
}

function renderComments(comments) {
  const ul = document.getElementById('comments');
  if (!comments || comments.length === 0) {
    ul.innerHTML = '<li class="comment-empty">Aucun commentaire. Lancez la discussion !</li>';
    return;
  }
  ul.innerHTML = comments
    .map(
      (c) => `
      <li class="comment">
        <span class="comment-author">${esc(c.auteur)}</span>
        <span class="comment-date">${fmtDate(c.date_creation)}</span>
        <p class="comment-body">${esc(c.contenu)}</p>
      </li>`,
    )
    .join('');
}

function setupCommentForm(user) {
  const form = document.getElementById('comment-form');
  const hint = document.getElementById('comment-hint');

  if (!user) {
    // Non connecté : la zone reste visible, mais tout clic (dans le champ ou
    // sur le bouton) redirige vers la connexion, avec retour vers ce jeu.
    form.hidden = false;
    hint.textContent = 'Connectez-vous pour écrire un commentaire.';
    const ta = form.querySelector('textarea');
    ta.placeholder = 'Connectez-vous pour commenter…';

    const askLogin = (e) => {
      e.preventDefault();
      const retour = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `./connexion.html?redirect=${retour}`;
    };
    ta.addEventListener('mousedown', askLogin); // clic dans le champ de texte
    form.addEventListener('submit', askLogin);  // clic sur le bouton « Commenter »
    return;
  }

  form.hidden = false;
  hint.textContent = '';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('comment-msg');
    msg.textContent = '';
    try {
      await api(`/community/games/${gameId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: form.contenu.value }),
      });
      form.contenu.value = '';
      // Recharge les commentaires.
      const game = await api(`/community/games/${gameId}`);
      renderComments(game.comments);
    } catch (err) {
      msg.textContent = err.message;
    }
  });
}
