const MENU_OPEN_CLASS = "menu-open";
const REVEAL_SELECTOR = ".reveal";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function initializeIcons() {
  if (!window.lucide) return;

  window.lucide.createIcons({
    attrs: {
      "stroke-width": 1.5,
    },
  });
}

function initializeRepositoryCarousel() {
  const carousel = document.querySelector(".repo-carousel");

  if (!carousel || !window.Swiper) return;

  const slides = carousel.querySelectorAll(".swiper-wrapper > .swiper-slide");

  slides.forEach((slide, activeIndex) => {
    const dotsContainer = slide.querySelector(".window-dots");

    if (!dotsContainer) return;

    const dots = document.createDocumentFragment();

    slides.forEach((_, dotIndex) => {
      const dot = document.createElement("i");
      dot.className = `dot${dotIndex === activeIndex ? " is-active" : ""}`;
      dots.appendChild(dot);
    });

    dotsContainer.replaceChildren(dots);
  });

  new window.Swiper(carousel, {
    effect: "cards",
    grabCursor: true,
    rewind: true,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    a11y: {
      enabled: true,
      containerMessage: "Repositórios em destaque",
      itemRoleDescriptionMessage: "Slide de repositório",
      prevSlideMessage: "Exibir repositório anterior",
      nextSlideMessage: "Exibir próximo repositório",
    },
    cardsEffect: {
      perSlideOffset: 8,
      perSlideRotate: 2,
      rotate: true,
      slideShadows: true,
    },
  });
}

function initializeThemeSwitcher() {
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  const menu = document.querySelector(".theme-menu");

  if (!toggle || !menu) return;

  function currentTheme() {
    return root.classList.contains("light") ? "light" : "dark";
  }

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    menu.classList.remove("open");
  }

  function applyTheme(theme) {
    const useLightTheme = theme === "light";
    root.classList.toggle("light", useLightTheme);
    toggle.setAttribute(
      "aria-label",
      useLightTheme ? "Alterar para o tema escuro" : "Alterar para o tema claro",
    );
    toggle.innerHTML = `<i data-lucide="${useLightTheme ? "moon" : "sun"}" aria-hidden="true"></i>`;
    menu.querySelectorAll("[data-theme]").forEach((option) => {
      option.classList.toggle("active", option.dataset.theme === theme);
    });
    localStorage.setItem("favoriteTheme", theme);
    initializeIcons();
    closeMenu();
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    menu.setAttribute("aria-hidden", String(isOpen));
    menu.classList.toggle("open", !isOpen);
  });

  menu.querySelectorAll("[data-theme]").forEach((option) => {
    option.addEventListener("click", () => applyTheme(option.dataset.theme));
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  applyTheme(currentTheme());
}

function initializeMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");

  if (!toggle || !menu) return;

  function setMenuState(isOpen) {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    menu.setAttribute("aria-hidden", String(!isOpen));
    menu.classList.toggle("open", isOpen);
    document.body.classList.toggle(MENU_OPEN_CLASS, isOpen);
  }

  function isMenuOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  toggle.addEventListener("click", () => setMenuState(!isMenuOpen()));

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isMenuOpen()) return;

    setMenuState(false);
    toggle.focus();
  });

  document.addEventListener("click", (event) => {
    const clickedOutside =
      !menu.contains(event.target) && !toggle.contains(event.target);

    if (isMenuOpen() && clickedOutside) setMenuState(false);
  });
}

function initializeScrollReveal() {
  const elements = document.querySelectorAll(REVEAL_SELECTOR);
  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("on"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("on");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  elements.forEach((element, index) => {
    element.style.transitionDelay = `${(index % 4) * 0.08}s`;
    observer.observe(element);
  });
}

function initializeContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (!form || !status) return;

  const fields = {
    name: form.elements.namedItem("nome"),
    email: form.elements.namedItem("email"),
    message: form.elements.namedItem("mensagem"),
  };

  function showError(field, message) {
    const error = document.getElementById(`erro-${field.id}`);

    field.setAttribute("aria-invalid", String(Boolean(message)));
    if (error) error.textContent = message;
  }

  function validateFields() {
    showError(
      fields.name,
      fields.name.value.trim() ? "" : "Conte como posso chamar você.",
    );
    showError(
      fields.email,
      fields.email.validity.valid ? "" : "Digite um e-mail válido.",
    );
    showError(
      fields.message,
      fields.message.value.trim().length >= 10
        ? ""
        : "Escreva ao menos 10 caracteres.",
    );

    return Object.values(fields).every(
      (field) => field.getAttribute("aria-invalid") === "false",
    );
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateFields()) {
      status.textContent = "Revise os campos indicados.";
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Validando sua mensagem…";

    window.setTimeout(() => {
      status.textContent =
        "Tudo certo! Esta foi apenas uma validação local; a mensagem não foi enviada.";
      button.disabled = false;
    }, 700);
  });

  Object.values(fields).forEach((field) => {
    field.addEventListener("input", () => showError(field, ""));
  });
}

function updateCurrentYear() {
  document.querySelectorAll("[data-current-year], #year").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });
}

initializeIcons();
initializeRepositoryCarousel();
initializeThemeSwitcher();
initializeMobileMenu();
initializeScrollReveal();
initializeContactForm();
updateCurrentYear();
