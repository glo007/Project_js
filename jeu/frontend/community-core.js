// Fonctions partagées par toutes les pages de la communauté.
const API = '/api';

// Menu burger (présent sur toutes les pages).
(function burger() {
  const navbar = document.querySelector('.navbar');
  const btn = document.querySelector('.burger');
  if (btn && navbar) {
    btn.addEventListener('click', () => navbar.classList.toggle('show-nav'));
  }
})();

// Appel API avec cookie de session (same-origin).
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { credentials: 'same-origin', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// Échappe le HTML (protection XSS du contenu utilisateur).
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleDateString('fr-FR');
}

// Récupère l'utilisateur connecté (ou null).
async function getCurrentUser() {
  try {
    const { user } = await api('/auth/me');
    return user;
  } catch {
    return null;
  }
}

// Affiche les liens de navigation selon l'état de connexion.
// Renvoie l'utilisateur courant (ou null).
async function renderAuthNav() {
  const nav = document.querySelector('.navbar__links');
  if (!nav) return null;
  nav.querySelectorAll('.auth-item').forEach((n) => n.remove());

  const user = await getCurrentUser();
  if (user) {
    nav.insertAdjacentHTML(
      'beforeend',
      `<li class="navbar__link auth-item"><a href="./ajouter-jeu.html">+ Ajouter un jeu</a></li>
       <li class="navbar__link auth-item"><a href="#" id="logout-link">Déconnexion (${esc(user.pseudo)})</a></li>`,
    );
    document.getElementById('logout-link').addEventListener('click', async (e) => {
      e.preventDefault();
      await api('/auth/logout', { method: 'POST' });
      window.location.href = './communaute.html';
    });
  } else {
    nav.insertAdjacentHTML(
      'beforeend',
      `<li class="navbar__link auth-item"><a href="./connexion.html">Connexion</a></li>
       <li class="navbar__link auth-item"><a href="./inscription.html">Inscription</a></li>`,
    );
  }
  return user;
}
