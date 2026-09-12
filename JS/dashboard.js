// ========================================
// STUDYSYNC — DASHBOARD
// ========================================

const welcomeName = document.getElementById("welcome-name");
const topbarUserName = document.getElementById("topbar-user-name");
const userAvatar = document.getElementById("user-avatar");

const logoutButton = document.getElementById("logout-button");

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobile-menu-button");

// ========================================
// GET CURRENT USER
// ========================================

async function loadDashboardUser() {
  const {
    data: { session },
    error,
  } = await studySyncSupabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    window.location.href = "login.html";
    return;
  }

  // No authenticated user
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.user;

  const fullName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

  const firstName = fullName.trim().split(" ")[0];

  welcomeName.textContent = firstName;
  topbarUserName.textContent = fullName;

  userAvatar.textContent = firstName.charAt(0).toUpperCase();
}

// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  const { error } = await studySyncSupabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);

    logoutButton.disabled = false;
    logoutButton.textContent = "Log out";

    return;
  }

  window.location.href = "login.html";
});

// ========================================
// MOBILE SIDEBAR
// ========================================

mobileMenuButton.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ========================================
// INITIALIZE
// ========================================

loadDashboardUser();
