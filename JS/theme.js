// ========================================
// STUDYSYNC — THEME
// ========================================

const themeToggle = document.getElementById("theme-toggle");

const savedTheme = localStorage.getItem("studysync-theme");

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
} else {
  document.documentElement.setAttribute("data-theme", "dark");
}

if (themeToggle) {
  updateThemeIcon();

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");

    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);

    localStorage.setItem("studysync-theme", newTheme);

    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const currentTheme = document.documentElement.getAttribute("data-theme");

  themeToggle.textContent = currentTheme === "dark" ? "☀" : "☾";

  themeToggle.setAttribute(
    "aria-label",
    currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
  );
}
