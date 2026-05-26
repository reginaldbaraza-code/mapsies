let deferredInstall: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function initPwaUi(
  banner: HTMLElement,
  installBtn: HTMLButtonElement,
  dismissBtn: HTMLButtonElement
): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e as BeforeInstallPromptEvent;
    banner.classList.remove("hidden");
  });

  installBtn.addEventListener("click", () => {
    void deferredInstall?.prompt().then(() => {
      banner.classList.add("hidden");
      deferredInstall = null;
    });
  });

  dismissBtn.addEventListener("click", () => banner.classList.add("hidden"));

  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* optional */
    });
  }
}

export function initPullToRefresh(onRefresh: () => void): void {
  let startY = 0;
  const el = document.querySelector(".content");
  if (!el) return;

  el.addEventListener(
    "touchstart",
    (e) => {
      if (window.scrollY === 0) startY = (e as TouchEvent).touches[0].clientY;
    },
    { passive: true }
  );

  el.addEventListener(
    "touchend",
    (e) => {
      const endY = (e as TouchEvent).changedTouches[0].clientY;
      if (window.scrollY === 0 && endY - startY > 90) onRefresh();
    },
    { passive: true }
  );
}

export function showOfflineBanner(banner: HTMLElement): void {
  const sync = () => banner.classList.toggle("hidden", navigator.onLine);
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  sync();
}
