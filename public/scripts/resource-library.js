(() => {
  "use strict";

  const normalise = (value) =>
    String(value ?? "")
      .normalize("NFKD")
      .toLocaleLowerCase()
      .trim();

  const initialiseLibrary = (library) => {
    if (library.dataset.resourceLibraryReady === "true") return;
    library.dataset.resourceLibraryReady = "true";

    const form = library.querySelector("[data-resource-filter-form]");
    const search = library.querySelector("[data-resource-search]");
    const filters = Array.from(
      library.querySelectorAll("[data-resource-filter]"),
    );
    const sort = library.querySelector("[data-resource-sort]");
    const grid = library.querySelector("[data-resource-grid]");
    const cards = Array.from(
      library.querySelectorAll("[data-resource-card]"),
    );
    const count = library.querySelector("[data-resource-count]");
    const empty = library.querySelector("[data-resource-empty]");
    const clearButtons = Array.from(
      library.querySelectorAll("[data-clear-filters], [data-empty-clear]"),
    );
    const filterDetails = library.querySelector(
      "[data-mobile-filter-details]",
    );

    const isEnglish = library.dataset.lang === "en";

    if (!form || !search || !sort || !grid || !count || !empty) return;

    const getFilteredCards = () => {
      const query = normalise(search.value);
      const selected = Object.fromEntries(
        filters.map((filter) => [
          filter.dataset.resourceFilter,
          filter.value,
        ]),
      );

      return cards.filter((card) => {
        const matchesSearch =
          !query || normalise(card.dataset.search).includes(query);

        const matchesCategory =
          !selected.category ||
          card.dataset.category === selected.category;

        const matchesType =
          !selected.type || card.dataset.type === selected.type;

        const matchesLanguage =
          !selected.language ||
          card.dataset.language === selected.language ||
          (selected.language !== "bilingual" &&
            card.dataset.language === "bilingual");

        const matchesStatus =
          !selected.status || card.dataset.status === selected.status;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesType &&
          matchesLanguage &&
          matchesStatus
        );
      });
    };

    const sortCards = (visibleCards) => {
      const mode = sort.value;

      return [...visibleCards].sort((a, b) => {
        if (mode === "title") {
          return String(a.dataset.title).localeCompare(
            String(b.dataset.title),
            isEnglish ? "en" : "zh-Hant",
            { sensitivity: "base" },
          );
        }

        if (mode === "category") {
          const categoryComparison = String(
            a.dataset.category,
          ).localeCompare(String(b.dataset.category));

          if (categoryComparison !== 0) return categoryComparison;

          return String(a.dataset.title).localeCompare(
            String(b.dataset.title),
            isEnglish ? "en" : "zh-Hant",
            { sensitivity: "base" },
          );
        }

        return (
          new Date(b.dataset.updated).getTime() -
          new Date(a.dataset.updated).getTime()
        );
      });
    };

    const updateResults = () => {
      const visibleCards = sortCards(getFilteredCards());
      const visibleSet = new Set(visibleCards);

      cards.forEach((card) => {
        const isVisible = visibleSet.has(card);
        card.hidden = !isVisible;
        card.setAttribute("aria-hidden", String(!isVisible));
      });

      visibleCards.forEach((card) => grid.appendChild(card));

      count.textContent = isEnglish
        ? `${visibleCards.length} ${
            visibleCards.length === 1
              ? "resource shown"
              : "resources shown"
          }`
        : `${visibleCards.length} 項資源`;

      empty.hidden = visibleCards.length !== 0;
      grid.hidden = visibleCards.length === 0;
    };

    const clearFilters = () => {
      form.reset();
      updateResults();
      search.focus();

      if (filterDetails && window.matchMedia("(max-width: 760px)").matches) {
        filterDetails.open = false;
      }
    };

    search.addEventListener("input", updateResults);
    filters.forEach((filter) =>
      filter.addEventListener("change", updateResults),
    );
    sort.addEventListener("change", updateResults);

    form.addEventListener("reset", () => {
      window.requestAnimationFrame(updateResults);
    });

    clearButtons.forEach((button) => {
      button.addEventListener("click", clearFilters);
    });

    updateResults();

    const dialog = library.querySelector("[data-download-dialog]");
    if (!dialog) return;

    const title = dialog.querySelector("[data-dialog-title]");
    const category = dialog.querySelector("[data-dialog-category]");
    const format = dialog.querySelector("[data-dialog-format]");
    const pages = dialog.querySelector("[data-dialog-pages]");
    const size = dialog.querySelector("[data-dialog-size]");
    const updated = dialog.querySelector("[data-dialog-updated]");
    const confirm = dialog.querySelector("[data-confirm-download]");
    const closeButtons = Array.from(
      dialog.querySelectorAll("[data-close-download]"),
    );

    let opener = null;

    const closeDialog = () => {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }

      if (opener instanceof HTMLElement) opener.focus();
    };

    library.querySelectorAll("[data-open-download]").forEach((button) => {
      button.addEventListener("click", () => {
        opener = button;

        title.textContent = button.dataset.downloadTitle || "";
        category.textContent = button.dataset.downloadCategory || "—";
        format.textContent = button.dataset.downloadFormat || "—";
        pages.textContent = button.dataset.downloadPages || "—";
        size.textContent = button.dataset.downloadSize || "—";
        updated.textContent = button.dataset.downloadUpdated || "—";

        confirm.href = button.dataset.downloadUrl || "#";

        if (button.dataset.downloadFilename) {
          confirm.setAttribute(
            "download",
            button.dataset.downloadFilename,
          );
        } else {
          confirm.setAttribute("download", "");
        }

        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      });
    });

    closeButtons.forEach((button) =>
      button.addEventListener("click", closeDialog),
    );

    confirm.addEventListener("click", () => {
      window.setTimeout(closeDialog, 100);
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });
  };

  const start = () => {
    document
      .querySelectorAll("[data-resource-library]")
      .forEach(initialiseLibrary);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
