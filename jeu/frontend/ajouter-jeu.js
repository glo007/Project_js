// Page ajout d'un jeu (réservée aux utilisateurs connectés).
(async function guard() {
  const user = await renderAuthNav();
  if (!user) {
    // Non connecté → redirection vers la connexion.
    window.location.href = './connexion.html';
  }
})();

document.getElementById('add-game-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = document.getElementById('add-game-msg');
  msg.textContent = '';
  try {
    // multipart/form-data : ne PAS fixer Content-Type (le navigateur s'en charge).
    const game = await api('/community/games', { method: 'POST', body: new FormData(f) });
    // Redirige vers la fiche du jeu créé.
    window.location.href = `./jeu.html?id=${game.id}`;
  } catch (err) {
    msg.textContent = err.message;
  }
});
