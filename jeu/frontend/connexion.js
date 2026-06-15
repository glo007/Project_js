// Page connexion.

// Destination après connexion : ?redirect=/chemin interne, sinon la communauté.
function destination() {
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') && !r.startsWith('//') ? r : './communaute.html';
}

// Le lien « Inscrivez-vous » conserve la redirection éventuelle.
(function forwardRedirect() {
  const r = new URLSearchParams(window.location.search).get('redirect');
  const link = document.querySelector('a[href="./inscription.html"]');
  if (r && link) link.href = `./inscription.html?redirect=${encodeURIComponent(r)}`;
})();

(async function init() {
  const user = await renderAuthNav();
  if (user) {
    // Déjà connecté → on redirige (vers le jeu d'origine si fourni).
    window.location.href = destination();
  }
})();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = document.getElementById('login-msg');
  msg.textContent = '';
  try {
    await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: f.email.value, mot_de_passe: f.mot_de_passe.value }),
    });
    window.location.href = destination();
  } catch (err) {
    msg.textContent = err.message;
  }
});
