let deferredInstallPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  createInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  document.getElementById("install-app-button")?.remove();
});

function createInstallButton() {
  if (document.getElementById("install-app-button")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.id = "install-app-button";
  button.className = "theme-toggle";
  button.textContent = "📲 Install app";
  button.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    button.remove();
  });

  const header = document.querySelector(".header-container");
  header?.appendChild(button);
}
