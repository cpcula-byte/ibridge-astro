(() => {
  "use strict";

  if (window.__iBridgeNavigationInitialised) return;
  window.__iBridgeNavigationInitialised = true;

  const addStylesheet = () => {
    if (document.querySelector('link[href="/styles/ibridge-navigation.css"]')) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/styles/ibridge-navigation.css";
    document.head.appendChild(link);
  };

  const addSkipLink = () => {
    if (document.querySelector(".site-skip-link")) return;

    const main = document.querySelector("main");
    if (!main) return;

    if (!main.id) main.id = "main-content";

    const link = document.createElement("a");
    link.className = "site-skip-link";
    link.href = `#${main.id}`;
    link.textContent =
      document.documentElement.lang.toLowerCase().startsWith("en")
        ? "Skip to main content"
        : "跳至主要內容";

    document.body.insertBefore(link, document.body.firstChild);
  };

  const initialiseNavigation = () => {
    addStylesheet();
    addSkipLink();

    const header = document.querySelector("header");
    if (!header) return;

    const buttons = Array.from(header.querySelectorAll("button"));
    const toggle = buttons.find((button) => {
      const text = [
        button.textContent,
        button.getAttribute("aria-label"),
        button.getAttribute("title"),
      ]
        .filter(Boolean)
        .join(" ");

      return /☰|menu|選單|選項|navigation/i.test(text);
    });

    const nav =
      header.querySelector("nav") ||
      document.querySelector("header + nav");

    if (!toggle || !nav) return;
    if (toggle.dataset.enhancedMenu === "true") return;

    toggle.dataset.enhancedMenu = "true";
    toggle.classList.add("site-menu-toggle");
    nav.classList.add("site-primary-navigation");

    if (!nav.id) nav.id = "site-primary-navigation";

    const isEnglish = document.documentElement.lang
      .toLowerCase()
      .startsWith("en");

    const openLabel = isEnglish
      ? "Open navigation menu"
      : "開啟網站選單";
    const closeLabel = isEnglish
      ? "Close navigation menu"
      : "關閉網站選單";

    toggle.setAttribute("type", "button");
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", openLabel);

    const overlay = document.createElement("div");
    overlay.className = "site-menu-overlay";
    overlay.hidden = true;
    document.body.appendChild(overlay);

    let previousFocus = null;

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const getFocusableElements = () =>
      Array.from(nav.querySelectorAll(focusableSelector)).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true",
      );

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    const openMenu = () => {
      previousFocus = document.activeElement;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", closeLabel);
      nav.classList.add("is-open");
      header.classList.add("menu-is-open");
      document.body.classList.add("site-menu-open");
      overlay.hidden = false;

      window.requestAnimationFrame(() => {
        overlay.classList.add("is-visible");
        const first = getFocusableElements()[0];
        if (first) first.focus();
      });
    };

    const closeMenu = ({ restoreFocus = true } = {}) => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", openLabel);
      nav.classList.remove("is-open");
      header.classList.remove("menu-is-open");
      document.body.classList.remove("site-menu-open");
      overlay.classList.remove("is-visible");

      window.setTimeout(() => {
        overlay.hidden = true;
      }, 180);

      if (restoreFocus) {
        const target =
          previousFocus instanceof HTMLElement ? previousFocus : toggle;
        target.focus();
      }
    };

    toggle.addEventListener("click", () => {
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay.addEventListener("click", () => closeMenu());

    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link && window.matchMedia("(max-width: 900px)").matches) {
        closeMenu({ restoreFocus: false });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!isOpen()) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        toggle.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 901px)");

    const handleDesktopChange = (event) => {
      if (event.matches && isOpen()) {
        closeMenu({ restoreFocus: false });
      }
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else {
      desktopQuery.addListener(handleDesktopChange);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseNavigation, {
      once: true,
    });
  } else {
    initialiseNavigation();
  }
})();
