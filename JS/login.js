// ========================================
// STUDYSYNC — LOGIN
// ========================================

const loginForm = document.getElementById("login-form");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginMessage = document.getElementById("login-message");

const passwordToggle = document.getElementById("password-toggle");

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

// ========================================
// LOGIN
// ========================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginMessage.textContent = "";
  loginMessage.style.color = "var(--color-danger)";

  // ========================================
  // VALIDATION
  // ========================================

  if (!email || !password) {
    loginMessage.textContent = "Please enter your email and password.";

    return;
  }

  // ========================================
  // BUTTON STATE
  // ========================================

  const submitButton = loginForm.querySelector(".auth-submit");

  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {
    // ========================================
    // SUPABASE LOGIN
    // ========================================

    const { data, error } = await studySyncSupabase.auth.signInWithPassword({
      email: email,
      password: password,
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

    console.log("Login successful:", data);

    loginMessage.style.color = "var(--color-success)";

    loginMessage.textContent = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  } catch (error) {
    console.error("Login error:", error);

    loginMessage.style.color = "var(--color-danger)";

    loginMessage.textContent = error.message || "Invalid email or password.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Log in";
  }
});
