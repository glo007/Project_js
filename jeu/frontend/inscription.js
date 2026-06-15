// Page inscription (bonus).

// Destination après inscription : ?redirect=/chemin interne, sinon la communauté.
function destination() {
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') && !r.startsWith('//') ? r : './communaute.html';
}

(async function init() {
  const user = await renderAuthNav();
  if (user) window.location.href = destination();
})();

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = document.getElementById('register-msg');
  msg.textContent = '';
  try {
    await api('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pseudo: f.pseudo.value,
        email: f.email.value,
        mot_de_passe: f.mot_de_passe.value,
      }),
    });
    // Inscription = connexion automatique → retour au jeu si fourni, sinon communauté.
    window.location.href = destination();
  } catch (err) {
    msg.textContent = err.message;
  }
});
