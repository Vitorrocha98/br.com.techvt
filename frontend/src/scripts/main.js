const themePortalBtn = document.querySelector('.header-theme-portal__button');
const themePortalDropdown = document.querySelector('.header-theme-portal__dropdown');
const themePortalBtnLight = document.querySelector(
  '.header-theme-portal__list--item__button-option.light',
);
const themePortalBtnDark = document.querySelector(
  '.header-theme-portal__list--item__button-option.dark',
);
const html = document.documentElement;

function applyTheme(theme) {
  if (theme === 'light') {
    themePortalBtn.classList.add('light-active');
    themePortalBtn.classList.remove('dark-active');
    html.classList.remove('dark');
  } else if (theme === 'dark') {
    themePortalBtn.classList.add('dark-active');
    themePortalBtn.classList.remove('light-active');
    html.classList.add('dark');
  }

  localStorage.setItem('favoriteTheme', theme);
  themePortalDropdown.classList.remove('active'); // fecha o themePortalDropdown
}

themePortalBtn.addEventListener('click', () => {
  themePortalDropdown.classList.toggle('active');
});

themePortalBtnLight.addEventListener('click', () => applyTheme('light'));

themePortalBtnDark.addEventListener('click', () => applyTheme('dark'));

window.addEventListener('DOMContentLoaded', () => {
  const temaSalvo = localStorage.getItem('favoriteTheme');

  if (temaSalvo) applyTheme(temaSalvo);
});
