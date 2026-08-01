(() => {
  "use strict";

  const normalise = (value) =>
    String(value ?? "")
      .normalize("NFKC")
      .trim()
      .toLocaleLowerCase();

  const initialiseDirectory = (root) => {
    const form = root.querySelector("[data-resource-filter-form]");
    const search = root.querySelector("[data-resource-search]");
    const family = root.querySelector("[data-resource-family]");
    const subject = root.querySelector("[data-resource-subject]");
    const reset = root.querySelector("[data-resource-reset]");
    const count = root.querySelector("[data-resource-count]");
    const empty = root.querySelector("[data-resource-empty]");
    const cards = Array.from(root.querySelectorAll("[data-resource-card]"));

    if (
      !(form instanceof HTMLFormElement) ||
      !(search instanceof HTMLInputElement) ||
      !(family instanceof HTMLSelectElement) ||
      !(subject instanceof HTMLSelectElement) ||
      !(count instanceof HTMLElement) ||
      !(empty instanceof HTMLElement)
    ) {
      return;
    }

    const language = root.dataset.language === "en" ? "en" : "zh";
    let timer = 0;

    const updateUrl = () => {
      const url = new URL(window.location.href);
      const values = {
        q: search.value.trim(),
        family: family.value,
        subject: subject.value,
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.delete(key);
        }
      });

      window.history.replaceState({}, "", url);
    };

    const update = () => {
      const query = normalise(search.value);
      const selectedFamily = family.value;
      const selectedSubject = subject.value;

      let visible = 0;

      cards.forEach((card) => {
        const matchesQuery =
          !query || normalise(card.dataset.search).includes(query);
        const matchesFamily =
          !selectedFamily || card.dataset.family === selectedFamily;
        const matchesSubject =
          !selectedSubject || card.dataset.subject === selectedSubject;
        const shouldShow = matchesQuery && matchesFamily && matchesSubject;

        card.hidden = !shouldShow;

        if (shouldShow) {
          visible += 1;
        }
      });

      count.textContent =
        language === "en"
          ? `${visible} ${visible === 1 ? "resource category" : "resource categories"}`
          : `${visible} 項資源分類`;

      empty.hidden = visible !== 0;
      updateUrl();
    };

    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      search.value = params.get("q") ?? "";
      family.value = params.get("family") ?? "";
      subject.value = params.get("subject") ?? "";
    };

    search.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 120);
    });

    family.addEventListener("change", update);
    subject.addEventListener("change", update);

    form.addEventListener("reset", () => {
      window.setTimeout(update, 0);
    });

    reset?.addEventListener("click", () => {
      search.focus();
    });

    restore();
    update();
  };

  const start = () => {
    document
      .querySelectorAll("[data-resource-directory]")
      .forEach(initialiseDirectory);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

