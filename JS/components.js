/* ========================================
   STUDYSYNC — COMPONENT LOADER
   ======================================== */

async function loadComponent(elementId, componentPath) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  try {
    const response = await fetch(componentPath);

    if (!response.ok) {
      throw new Error(`Failed to load component: ${componentPath}`);
    }

    const html = await response.text();

    element.innerHTML = html;

    /* Tell the rest of the application
           that this component is ready */

    document.dispatchEvent(
      new CustomEvent("componentLoaded", {
        detail: {
          elementId: elementId,
        },
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

/* ---------- LOAD GLOBAL COMPONENTS ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("navbar", "components/navbar.html");
});
