// STUDYSYNC — DASHBOARD

const welcomeGreeting = document.getElementById("welcome-greeting");
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

let currentUser = null;
let currentPartner = null;

function escapeHTML(value = "") {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCheckinDate(checkin) {
  const dateString =
    checkin.check_in_date || getLocalDateString(new Date(checkin.created_at));

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// LOAD AUTHENTICATED USER

async function loadDashboardUser() {
  const {
    data: { session },
    error,
  } = await studySyncSupabase.auth.getSession();

  if (error || !session) {
    if (error) console.error("Session error:", error);
    window.location.href = "login.html";
    return;
  }

  currentUser = session.user;

  const fullName =
    currentUser.user_metadata?.full_name ||
    currentUser.email?.split("@")[0] ||
    "there";

  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  const hour = new Date().getHours();

  welcomeGreeting.textContent =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  welcomeName.textContent = firstName;
  topbarUserName.textContent = fullName;
  userAvatar.textContent = firstName.charAt(0).toUpperCase();

  await Promise.all([loadCheckins(), loadDashboardPartner()]);
}

// LOGOUT

logoutButton?.addEventListener("click", async () => {
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

// MOBILE SIDEBAR

mobileMenuButton?.addEventListener("click", () => {
  sidebar?.classList.toggle("open");
});

sidebar?.querySelectorAll(".nav-item").forEach((link) => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
});

// CHECK-IN MODAL

function openCheckinModal() {
  checkinModal?.classList.add("open");

  window.setTimeout(() => {
    checkinContent?.focus();
  }, 200);
}

function closeCheckinModal() {
  checkinModal?.classList.remove("open");

  if (checkinMessage) {
    checkinMessage.textContent = "";
  }
}

makeCheckinButton?.addEventListener("click", openCheckinModal);
closeCheckinButton?.addEventListener("click", closeCheckinModal);

checkinModal?.addEventListener("click", (event) => {
  if (event.target === checkinModal) {
    closeCheckinModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && checkinModal?.classList.contains("open")) {
    closeCheckinModal();
  }
});

// CALCULATE STREAK FROM THE CURRENT USER'S OWN CHECK-INS

function calculateStreak(checkins) {
  if (!checkins?.length) return 0;

  const uniqueDates = [
    ...new Set(checkins.map((item) => item.check_in_date).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a));

  if (!uniqueDates.length) return 0;

  const today = getLocalDateString();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterday = getLocalDateString(yesterdayDate);

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const [yearA, monthA, dayA] = uniqueDates[i - 1].split("-").map(Number);

    const [yearB, monthB, dayB] = uniqueDates[i].split("-").map(Number);

    const newer = Date.UTC(yearA, monthA - 1, dayA);
    const older = Date.UTC(yearB, monthB - 1, dayB);

    const daysApart = Math.round((newer - older) / 86400000);

    if (daysApart === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// LOAD ACTIVITY FEED

async function loadCheckins() {
  try {
    if (!currentUser) {
      const {
        data: { user },
        error: userError,
      } = await studySyncSupabase.auth.getUser();

      if (userError) throw userError;

      currentUser = user;
    }

    if (!currentUser) {
      window.location.href = "login.html";
      return;
    }

    const { data: checkins, error } = await studySyncSupabase
      .from("check_ins")
      .select("id, user_id, content, created_at, check_in_date")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const safeCheckins = checkins || [];

    const ownCheckins = safeCheckins.filter(
      (item) => item.user_id === currentUser.id,
    );

    const streak = calculateStreak(ownCheckins);

    currentStreak.textContent = `${streak} ${streak === 1 ? "day" : "days"}`;

    const today = getLocalDateString();

    const checkedInToday = ownCheckins.some(
      (item) => item.check_in_date === today,
    );

    todayStatus.textContent = checkedInToday
      ? "Checked in ✓"
      : "Not checked in";

    todayStatusMessage.textContent = checkedInToday
      ? "Nice work. You showed up today."
      : "Share what you accomplished today.";

    const partnerId = currentPartner?.id;

    const visibleCheckins = safeCheckins
      .filter(
        (item) =>
          item.user_id === currentUser.id ||
          (partnerId && item.user_id === partnerId),
      )
      .slice(0, 12);

    if (!visibleCheckins.length) {
      recentCheckinsEmpty.style.display = "flex";
      recentCheckinsList.innerHTML = "";
      return;
    }

    const ownName =
      currentUser.user_metadata?.full_name ||
      currentUser.email?.split("@")[0] ||
      "You";

    const partnerName = currentPartner?.full_name || "Your partner";

    recentCheckinsEmpty.style.display = "none";
    recentCheckinsList.innerHTML = "";

    visibleCheckins.forEach((checkin) => {
      const isOwn = checkin.user_id === currentUser.id;

      const item = document.createElement("article");

      item.className = isOwn
        ? "recent-checkin-item"
        : "recent-checkin-item partner-checkin-item";

      const createdAt = new Date(checkin.created_at);

      const formattedTime = createdAt.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });

      const authorName = isOwn ? ownName : partnerName;
      const authorLabel = isOwn ? "You" : "Your partner";

      item.innerHTML = `
        <div class="recent-checkin-icon" aria-hidden="true">
          ${isOwn ? "✓" : "♧"}
        </div>

        <div class="recent-checkin-content">
          <div class="checkin-author-row">
            <strong>${escapeHTML(authorName)}</strong>
            <span class="checkin-author-label">${authorLabel}</span>
          </div>

          <p>${escapeHTML(checkin.content || "")}</p>

          <span>
            ${escapeHTML(formatCheckinDate(checkin))}
            ·
            ${escapeHTML(formattedTime)}
          </span>
        </div>
      `;

      recentCheckinsList.appendChild(item);
    });
  } catch (error) {
    console.error("Load activity feed error:", error);

    recentCheckinsEmpty.style.display = "flex";

    recentCheckinsEmpty.innerHTML = `
      <div class="empty-state-icon">!</div>
      <h3>Couldn't load activity</h3>
      <p>Please refresh the page and try again.</p>
    `;
  }
}

// SUBMIT CHECK-IN

checkinForm?.addEventListener("submit", async (event) => {
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

    if (userError) throw userError;

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const { error } = await studySyncSupabase.from("check_ins").insert({
      user_id: user.id,
      content,
      check_in_date: getLocalDateString(),
    });

    if (error) {
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
    currentUser = user;

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

// LOAD CONNECTED PARTNER CARD

async function loadDashboardPartner() {
  const partnerCard = document.getElementById("partner-card");

  if (!partnerCard) return;

  try {
    const { data: partners, error } = await studySyncSupabase.rpc(
      "get_current_partner",
    );

    if (error) throw error;

    if (!partners?.length) {
      currentPartner = null;

      partnerCard.innerHTML = `
        <div class="panel-heading">
          <div>
            <span class="panel-eyebrow">Accountability</span>
            <h2>Your partner</h2>
          </div>

          <span class="panel-status">Not connected</span>
        </div>

        <div class="empty-state">
          <div class="empty-state-icon">♧</div>
          <h3>No accountability partner yet</h3>
          <p>
            Connect with someone and start showing up together.
          </p>
          <a href="partner.html" class="secondary-button">
            Find a partner
          </a>
        </div>
      `;

      updatePartnerOverview(null);
      await loadCheckins();
      return;
    }

    currentPartner = partners[0];

    const partner = currentPartner;
    const fullName = partner.full_name || "StudySync user";
    const username = partner.username || "username";

    const avatar = partner.avatar_url
      ? `<img src="${escapeHTML(partner.avatar_url)}" alt="" />`
      : escapeHTML(fullName.charAt(0).toUpperCase());

    partnerCard.innerHTML = `
      <div class="panel-heading">
        <div>
          <span class="panel-eyebrow">Accountability</span>
          <h2>Your partner</h2>
        </div>

        <span class="panel-status">Connected</span>
      </div>

      <div class="dashboard-partner">
        <div class="dashboard-partner-info">
          <div class="dashboard-partner-avatar">
            ${avatar}
          </div>

          <div>
            <h3>${escapeHTML(fullName)}</h3>
            <p>@${escapeHTML(username)}</p>
            <span class="partner-status">Connected</span>
          </div>
        </div>

        <a href="partner.html" class="secondary-button">
          View partner
        </a>
      </div>
    `;

    updatePartnerOverview(partner);

    await loadCheckins();
  } catch (error) {
    console.error("Load dashboard partner error:", error);
  }
}

// UPDATE ACCOUNTABILITY OVERVIEW CARD

function updatePartnerOverview(partner) {
  const cards = document.querySelectorAll(".overview-card");

  let partnerCard = null;

  cards.forEach((card) => {
    const label = card.querySelector(".overview-label");

    if (label?.textContent.trim() === "Accountability partner") {
      partnerCard = card;
    }
  });

  if (!partnerCard) return;

  const heading = partnerCard.querySelector("h2");
  const description = partnerCard.querySelector("p");

  if (heading) {
    heading.textContent = partner?.full_name || "Not connected";
  }

  if (description) {
    description.textContent = partner
      ? `@${partner.username || "username"}`
      : "Invite someone to keep you accountable.";
  }
}

// INITIALIZE

loadDashboardUser();
