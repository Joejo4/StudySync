// ========================================
// STUDYSYNC — SIGNUP
// ========================================

const signupForm = document.getElementById("signup-form");

const fullNameInput = document.getElementById("full-name");

const usernameInput = document.getElementById("username");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const confirmPasswordInput = document.getElementById("confirm-password");

const signupMessage = document.getElementById("signup-message");

const passwordToggle = document.getElementById("password-toggle");

const confirmPasswordToggle = document.getElementById(
  "confirm-password-toggle",
);

// ========================================
// PASSWORD VISIBILITY
// ========================================

passwordToggle.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";

  passwordToggle.textContent = isPassword ? "Hide" : "Show";

  passwordToggle.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password",
  );
});

confirmPasswordToggle.addEventListener("click", () => {
  const isPassword = confirmPasswordInput.type === "password";

  confirmPasswordInput.type = isPassword ? "text" : "password";

  confirmPasswordToggle.textContent = isPassword ? "Hide" : "Show";

  confirmPasswordToggle.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password",
  );
});

// ========================================
// SIGNUP
// ========================================

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // ========================================
  // GET VALUES
  // ========================================

  const fullName = fullNameInput.value.trim();

  const username = usernameInput.value.trim().toLowerCase();

  const email = emailInput.value.trim();

  const password = passwordInput.value;

  const confirmPassword = confirmPasswordInput.value;

  // Clear previous message
  signupMessage.textContent = "";

  // ========================================
  // VALIDATION
  // ========================================

  if (!fullName) {
    signupMessage.textContent = "Please enter your full name.";

    return;
  }

  if (!username) {
    signupMessage.textContent = "Please choose a username.";

    return;
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    signupMessage.textContent =
      "Username must be 3–20 characters and can only contain letters, numbers, and underscores.";

    return;
  }

  if (password.length < 6) {
    signupMessage.textContent = "Password must be at least 6 characters.";

    return;
  }

  if (password !== confirmPassword) {
    signupMessage.textContent = "Passwords do not match.";

    return;
  }

  // ========================================
  // DISABLE BUTTON
  // ========================================

  const submitButton = signupForm.querySelector(".auth-submit");

  submitButton.disabled = true;

  submitButton.textContent = "Creating account...";

  // ========================================
  // SUPABASE SIGNUP
  // ========================================

  try {
    const { data, error } = await studySyncSupabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });

    // ========================================
    // HANDLE ERROR
    // ========================================

    if (error) {
      throw error;
    }

    // ========================================
    // SUCCESS
    // ========================================

    console.log("Signup successful:", data);

    signupMessage.style.color = "var(--color-success)";

    signupMessage.textContent =
      "Account created! Check your email to confirm your account.";

    signupForm.reset();
  } catch (error) {
    console.error("Signup error:", error);

    signupMessage.style.color = "var(--color-danger)";

    signupMessage.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    submitButton.disabled = false;

    submitButton.textContent = "Create account";
  }
});
