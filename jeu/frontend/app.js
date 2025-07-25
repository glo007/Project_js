function toggleMenu () {  
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

const techLogos = {
  solo: './asset/sologame.svg',
  multi: './asset/multiplayer.svg',
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.jeu').forEach(jeuEl => {
    jeuEl.addEventListener('click', () => {
      const dataDiv = jeuEl.querySelector('.project-jeu');
      if (!dataDiv) return;

      const imgsrc = dataDiv.getAttribute('data-img');
      const desc = dataDiv.getAttribute('data-desc');
      const title = dataDiv.getAttribute('data-title');
      const tech = dataDiv.getAttribute('data-tech')?.split(',') || [];

      document.getElementById('modal-img').src = imgsrc;
      document.getElementById('modal-title').innerText = title;
      document.getElementById('modal-desc').innerText = desc;

      const techsDiv = document.getElementById('modal-tech');
      techsDiv.innerHTML = '';
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

      document.getElementById('project-modal').style.display = 'flex';
    });
  });

  document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('project-modal').style.display = 'none';
  });

  document.getElementById('project-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      document.getElementById('project-modal').style.display = 'none';
    }
  });
});
