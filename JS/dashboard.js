// ========================================
// STUDYSYNC — DASHBOARD
// ========================================

const welcomeName = document.getElementById("welcome-name");
const topbarUserName = document.getElementById("topbar-user-name");
const userAvatar = document.getElementById("user-avatar");

const logoutButton = document.getElementById("logout-button");

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobile-menu-button");

const makeCheckinButton = document.getElementById("make-checkin-button");

const checkinModal = document.getElementById("checkin-modal");

const closeCheckinButton = document.getElementById("close-checkin-modal");

const checkinForm = document.getElementById("checkin-form");

const checkinContent = document.getElementById("checkin-content");

const checkinMessage = document.getElementById("checkin-message");

const todayStatus = document.getElementById("today-status");

const todayStatusMessage = document.getElementById("today-status-message");

const recentCheckinsEmpty = document.getElementById("recent-checkins-empty");

const recentCheckinsList = document.getElementById("recent-checkins-list");
const currentStreak = document.getElementById("current-streak");

// ========================================
// LOAD DASHBOARD USER
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

const sidebarLinks = sidebar.querySelectorAll(".nav-item");

sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
});

// ========================================
// CHECK-IN MODAL
// ========================================

function openCheckinModal() {
  checkinModal.classList.add("open");

  setTimeout(() => {
    checkinContent.focus();
  }, 200);
}

function closeCheckinModal() {
  checkinModal.classList.remove("open");

  checkinMessage.textContent = "";
}

// Open modal

makeCheckinButton.addEventListener("click", () => {
  openCheckinModal();
});

// Close modal with X

closeCheckinButton.addEventListener("click", () => {
  closeCheckinModal();
});

// Close modal by clicking outside

checkinModal.addEventListener("click", (event) => {
  if (event.target === checkinModal) {
    closeCheckinModal();
  }
});

// Close modal with Escape key

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && checkinModal.classList.contains("open")) {
    closeCheckinModal();
  }
});

// ========================================
// LOAD CHECK-INS
// ========================================
function escapeHTML(value) {
  const div = document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}
async function loadCheckins() {
  try {
    const {
      data: { user },
      error: userError,
    } = await studySyncSupabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    // Get the user's check-ins

    const { data: checkins, error } = await studySyncSupabase
      .from("check_ins")
      .select("id, content, created_at, check_in_date")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }
    const streak = calculateStreak(checkins);

    currentStreak.textContent = `${streak} ${streak === 1 ? "day" : "days"}`;

    // No check-ins
    if (!checkins || checkins.length === 0) {
      currentStreak.textContent = "0 days";
      todayStatus.textContent = "Not checked in";

      todayStatusMessage.textContent = "Share what you accomplished today.";

      recentCheckinsEmpty.style.display = "flex";

      recentCheckinsList.innerHTML = "";

      return;
    }

    // ----------------------------------------
    // CHECK IF USER CHECKED IN TODAY
    // ----------------------------------------

    const today = new Date();

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const checkedInToday = checkins.some((checkin) => {
      const checkinDate = new Date(checkin.created_at);

      return checkinDate >= todayStart && checkinDate < todayEnd;
    });

    if (checkedInToday) {
      todayStatus.textContent = "Checked in ✓";

      todayStatusMessage.textContent = "Nice work. You showed up today.";
    } else {
      todayStatus.textContent = "Not checked in";

      todayStatusMessage.textContent = "Share what you accomplished today.";
    }

    // ----------------------------------------
    // DISPLAY RECENT CHECK-INS
    // ----------------------------------------

    recentCheckinsEmpty.style.display = "none";

    recentCheckinsList.innerHTML = "";

    checkins.forEach((checkin) => {
      const item = document.createElement("article");

      item.className = "recent-checkin-item";

      const date = new Date(checkin.created_at);

      const formattedDate = date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const formattedTime = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });

      item.innerHTML = `
                <div class="recent-checkin-icon">
                    ✓
                </div>

                <div class="recent-checkin-content">
                    <p>${escapeHTML(checkin.content)}</p>

                    <span>
                        ${formattedDate} · ${formattedTime}
                    </span>
                </div>
            `;

      recentCheckinsList.appendChild(item);
    });
  } catch (error) {
    console.error("Load check-ins error:", error);
  }
}

// CHECK-IN SUBMIT
checkinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = checkinContent.value.trim();

  if (!content) {
    checkinMessage.style.color = "var(--color-danger)";

    checkinMessage.textContent = "Tell us what you accomplished today.";

    return;
  }

  const submitButton = checkinForm.querySelector(".checkin-submit");

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  checkinMessage.textContent = "";

  try {
    const {
      data: { user },
      error: userError,
    } = await studySyncSupabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Get today's date using the user's browser timezone
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    const checkInDate = `${year}-${month}-${day}`;

    const { error } = await studySyncSupabase.from("check_ins").insert({
      user_id: user.id,
      content: content,
      check_in_date: checkInDate,
    });

    if (error) {
      // User already checked in today
      if (error.code === "23505") {
        checkinMessage.style.color = "var(--color-warning)";

        checkinMessage.textContent =
          "You've already checked in today. Come back tomorrow! ✓";

        return;
      }

      throw error;
    }

    checkinMessage.style.color = "var(--color-success)";

    checkinMessage.textContent = "Check-in recorded! 🎉";

    checkinForm.reset();

    // Refresh dashboard data
    await loadCheckins();
  } catch (error) {
    console.error("Check-in error:", error);

    checkinMessage.style.color = "var(--color-danger)";

    checkinMessage.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    submitButton.disabled = false;

    submitButton.textContent = "Submit check-in";
  }
});

// CALCULATE CURRENT STREAK
function calculateStreak(checkins) {
  if (!checkins || checkins.length === 0) {
    return 0;
  }

  // Get unique check-in dates
  const dates = [...new Set(checkins.map((checkin) => checkin.check_in_date))];

  // Sort newest → oldest
  dates.sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const today = new Date();

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Convert today's date to YYYY-MM-DD
  const todayString = `${todayDate.getFullYear()}-${String(
    todayDate.getMonth() + 1,
  ).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

  // Streak must include today
  if (dates[0] !== todayString) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i - 1]);

    const previous = new Date(dates[i]);

    const difference = Math.round((current - previous) / (1000 * 60 * 60 * 24));

    if (difference === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
// ========================================
// INITIALIZE
// ========================================

loadDashboardUser();
loadCheckins();
