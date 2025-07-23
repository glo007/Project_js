function toggleMenu () {  
  const navbar = document.querySelector('.navbar');
  const burger = document.querySelector('.burger');
  
  burger.addEventListener('click', (e) => {    
    navbar.classList.toggle('show-nav');
  });    
  // bonus
  const navbarLinks = document.querySelectorAll('.navbar a');
  navbarLinks.forEach(link => {
    link.addEventListener('click', (e) => {    
      navbar.classList.toggle('show-nav');
    }); 
  })
   
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