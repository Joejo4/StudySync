/* ========================================
   STUDYSYNC — LANDING PAGE INTERACTIONS
   ======================================== */

/* ---------- INITIALIZE NAVBAR ---------- */

function initializeNavbar() {
  const menuButton = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector("#mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link");

  /* Make sure the navbar exists */

  if (!menuButton || !mobileMenu) {
    console.warn("StudySync: Navbar not found.");
    return;
  }

  /* ---------- MOBILE MENU TOGGLE ---------- */

  menuButton.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");

    menuButton.classList.toggle("is-active", isOpen);

    menuButton.setAttribute("aria-expanded", String(isOpen));

    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  });

  /* ---------- CLOSE AFTER LINK CLICK ---------- */

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");

      menuButton.classList.remove("is-active");

      menuButton.setAttribute("aria-expanded", "false");

      menuButton.setAttribute("aria-label", "Open navigation menu");
    });
  });
}

/* ---------- WAIT FOR NAVBAR ---------- */

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.elementId === "navbar") {
    initializeNavbar();
  }
});
