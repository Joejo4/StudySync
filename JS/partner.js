// =========================================
// DOM REFERENCES
// =========================================

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobile-menu-button");
const logoutButton = document.getElementById("logout-button");

const topbarUserName = document.getElementById("topbar-user-name");
const userAvatar = document.getElementById("user-avatar");

const partnerSearchForm = document.getElementById("partner-search-form");

const partnerUsername = document.getElementById("partner-username");

const findPartnerButton = document.getElementById("find-partner-button");

const partnerMessage = document.getElementById("partner-message");

const partnerResult = document.getElementById("partner-result");

const resultAvatar = document.getElementById("result-avatar");

const resultName = document.getElementById("result-name");

const resultUsername = document.getElementById("result-username");

const sendRequestButton = document.getElementById("send-request-button");

// Stores the user we found
let selectedPartner = null;

// =========================================
// LOAD CURRENT USER
// =========================================

async function loadCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await studySyncSupabase.auth.getUser();

    if (error) throw error;

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const fullName = user.user_metadata?.full_name || "User";

    const firstName = fullName.split(" ")[0];

    topbarUserName.textContent = firstName;

    userAvatar.textContent = firstName.charAt(0).toUpperCase();
  } catch (error) {
    console.error("Load current user error:", error);
  }
}

// =========================================
// MOBILE SIDEBAR
// =========================================

if (mobileMenuButton) {
  mobileMenuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

document.querySelectorAll(".nav-item").forEach((navItem) => {
  navItem.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
});

// =========================================
// LOGOUT
// =========================================

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
      const { error } = await studySyncSupabase.auth.signOut();

      if (error) throw error;

      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout error:", error);

      logoutButton.disabled = false;
    }
  });
}

// =========================================
// MESSAGE HELPER
// =========================================

function showMessage(message, type = "") {
  partnerMessage.textContent = message;

  partnerMessage.className = "partner-message";

  if (type) {
    partnerMessage.classList.add(type);
  }
}

// =========================================
// GET INITIAL
// =========================================

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await studySyncSupabase.auth.getUser();

  if (error) throw error;

  if (!user) {
    window.location.href = "login.html";
    return null;
  }

  return user;
}

// =========================================
// FIND PARTNER
// =========================================

partnerSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = partnerUsername.value.trim().toLowerCase();

  if (!username) {
    showMessage("Enter a username first.", "error");

    return;
  }

  findPartnerButton.disabled = true;
  findPartnerButton.textContent = "Finding...";

  partnerResult.hidden = true;
  selectedPartner = null;

  showMessage("");

  try {
    const user = await getCurrentUser();

    if (!user) return;

    // Find exact username
    const { data, error } = await studySyncSupabase.rpc(
      "find_profile_by_username",
      {
        search_username: username,
      },
    );

    if (error) throw error;

    if (!data || data.length === 0) {
      showMessage(
        `We couldn't find @${username}. Check the username and try again.`,
        "error",
      );

      return;
    }

    const profile = data[0];

    // Don't allow yourself
    if (profile.id === user.id) {
      showMessage("You cannot add yourself as a partner.", "warning");

      return;
    }

    // Store selected user
    selectedPartner = profile;

    // Display result
    resultName.textContent = profile.full_name || "StudySync user";

    resultUsername.textContent = `@${profile.username}`;

    if (profile.avatar_url) {
      resultAvatar.innerHTML = `
                    <img
                        src="${escapeHTML(profile.avatar_url)}"
                        alt=""
                    />
                `;
    } else {
      resultAvatar.textContent = (profile.full_name || profile.username || "U")
        .charAt(0)
        .toUpperCase();
    }

    partnerResult.hidden = false;

    showMessage("User found. You can now send a partner request.", "success");
  } catch (error) {
    console.error("Find partner error:", error);

    showMessage(
      error.message || "Something went wrong. Please try again.",
      "error",
    );
  } finally {
    findPartnerButton.disabled = false;
    findPartnerButton.textContent = "Find partner";
  }
});

// =========================================
// SEND PARTNER REQUEST
// =========================================

sendRequestButton.addEventListener("click", async () => {
  if (!selectedPartner) {
    showMessage("Find a user first.", "error");

    return;
  }

  sendRequestButton.disabled = true;
  sendRequestButton.textContent = "Sending...";

  try {
    const user = await getCurrentUser();

    if (!user) return;

    const { error } = await studySyncSupabase.rpc("send_partner_request", {
      target_user_id: selectedPartner.id,
    });

    if (error) {
      const message = error.message || "";

      if (message.includes("already pending")) {
        showMessage("A partner request is already pending.", "warning");
      } else if (message.includes("already partners")) {
        showMessage("You are already partners with this user.", "warning");
      } else {
        throw error;
      }

      return;
    }

    showMessage(
      `Partner request sent to @${selectedPartner.username}! 🎉`,
      "success",
    );

    sendRequestButton.textContent = "Request sent";

    // Keep result visible but prevent
    // sending the same request again
    sendRequestButton.disabled = true;
  } catch (error) {
    console.error("Send partner request error:", error);

    showMessage(
      error.message || "Something went wrong. Please try again.",
      "error",
    );

    sendRequestButton.disabled = false;
    sendRequestButton.textContent = "Send request";
  }
});

// ESCAPE HTML

function escapeHTML(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}

// LOAD INCOMING PARTNER REQUESTS

async function loadIncomingRequests() {
  const requestsList = document.getElementById("requests-list");

  const requestsEmpty = document.getElementById("requests-empty");

  try {
    const user = await getCurrentUser();

    if (!user) return;

    const { data: requests, error } = await studySyncSupabase.rpc(
      "get_incoming_partner_requests",
    );

    if (error) throw error;

    // Remove existing request cards
    requestsList
      .querySelectorAll(".partner-request")
      .forEach((item) => item.remove());

    // No requests
    if (!requests || requests.length === 0) {
      requestsEmpty.style.display = "flex";
      return;
    }

    requestsEmpty.style.display = "none";

    requests.forEach((request) => {
      const fullName = request.sender_full_name || "StudySync user";

      const username = request.sender_username || "username";

      const avatarLetter = fullName.charAt(0).toUpperCase();

      const requestElement = document.createElement("div");

      requestElement.className = "partner-request";

      requestElement.dataset.requestId = request.id;

      requestElement.innerHTML = `
                <div class="partner-user-info">

                    <div class="partner-avatar">
                        ${
                          request.sender_avatar_url
                            ? `<img
                                    src="${escapeHTML(
                                      request.sender_avatar_url,
                                    )}"
                                    alt=""
                                />`
                            : avatarLetter
                        }
                    </div>

                    <div>
                        <h3>
                            ${escapeHTML(fullName)}
                        </h3>

                        <p>
                            @${escapeHTML(username)}
                        </p>
                    </div>

                </div>

                <div class="request-actions">

                    <button
                        type="button"
                        class="secondary-button accept-request"
                        data-request-id="${request.id}"
                    >
                        Accept
                    </button>

                    <button
                        type="button"
                        class="decline-button decline-request"
                        data-request-id="${request.id}"
                    >
                        Decline
                    </button>

                </div>
            `;

      requestsList.appendChild(requestElement);
    });
  } catch (error) {
    console.error("Load incoming requests error:", error);
  }
}

async function respondToRequest(requestId, response) {
  try {
    const { error } = await studySyncSupabase.rpc(
      "respond_to_partner_request",
      {
        request_id: requestId,
        response: response,
      },
    );

    if (error) throw error;

    await loadIncomingRequests();

    if (response === "accepted") {
      await loadCurrentPartner();

      showMessage("Partner request accepted! 🎉", "success");
    } else {
      showMessage("Partner request declined.", "success");
    }
  } catch (error) {
    console.error("Respond to partner request error:", error);

    showMessage(
      error.message || "Something went wrong. Please try again.",
      "error",
    );
  }
}

const requestsList = document.getElementById("requests-list");

requestsList.addEventListener("click", async (event) => {
  const acceptButton = event.target.closest(".accept-request");

  const declineButton = event.target.closest(".decline-request");

  if (acceptButton) {
    const requestId = acceptButton.dataset.requestId;

    acceptButton.disabled = true;
    acceptButton.textContent = "Accepting...";

    await respondToRequest(requestId, "accepted");

    return;
  }

  if (declineButton) {
    const requestId = declineButton.dataset.requestId;

    declineButton.disabled = true;
    declineButton.textContent = "Declining...";

    await respondToRequest(requestId, "declined");
  }
});

async function loadCurrentPartner() {
  const currentPartner = document.getElementById("current-partner");

  const currentPartnerEmpty = document.getElementById("current-partner-empty");

  try {
    const user = await getCurrentUser();

    if (!user) return;

    const { data: partners, error } = await studySyncSupabase.rpc(
      "get_current_partner",
    );

    if (error) throw error;

    if (!partners || partners.length === 0) {
      currentPartner.style.display = "none";
      currentPartnerEmpty.style.display = "flex";
      return;
    }

    const partner = partners[0];

    const fullName = partner.full_name || "StudySync user";

    const username = partner.username || "username";

    const avatarLetter = fullName.charAt(0).toUpperCase();

    if (partner.avatar_url) {
      currentPartner.innerHTML = `
                <div class="partner-user-info">

                    <div class="partner-avatar">

                        <img
                            src="${escapeHTML(partner.avatar_url)}"
                            alt=""
                        />

                    </div>

                    <div>
                        <h3>
                            ${escapeHTML(fullName)}
                        </h3>

                        <p>
                            @${escapeHTML(username)}
                        </p>

                        <span class="partner-status">
                            Connected
                        </span>
                    </div>

                </div>
            `;
    } else {
      currentPartner.innerHTML = `
                <div class="partner-user-info">

                    <div class="partner-avatar">
                        ${escapeHTML(avatarLetter)}
                    </div>

                    <div>
                        <h3>
                            ${escapeHTML(fullName)}
                        </h3>

                        <p>
                            @${escapeHTML(username)}
                        </p>

                        <span class="partner-status">
                            Connected
                        </span>
                    </div>

                </div>
            `;
    }

    currentPartner.style.display = "flex";
    currentPartnerEmpty.style.display = "none";
  } catch (error) {
    console.error("Load current partner error:", error);
  }
}

// INITIALIZE

loadCurrentUser();
loadIncomingRequests();
loadCurrentPartner();
