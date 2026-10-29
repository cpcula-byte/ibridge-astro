function initNavigation() {
  const header = document.querySelector<HTMLElement>('[data-ibx-header]');
  if (!header || header.dataset.ready) return;
  header.dataset.ready = 'true';
  const nav = header.querySelector<HTMLElement>('.ibx-nav')!;
  const mobile = header.querySelector<HTMLButtonElement>('.ibx-mobile-toggle')!;
  const media = window.matchMedia('(min-width: 1320px)');
  const toggles = [...header.querySelectorAll<HTMLButtonElement>('.ibx-expand')];
  function setSub(button: HTMLButtonElement, open: boolean) {
    const panel = document.getElementById(button.getAttribute('aria-controls')!);
    button.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
  }
  function closeSubmenus(except?: HTMLButtonElement) {
    toggles.forEach(button => { if (button !== except) setSub(button, false); });
  }
  function closeMobile() {
    mobile.setAttribute('aria-expanded', 'false');
    nav.classList.remove('ibx-open');
    closeSubmenus();
  }
  toggles.forEach(button => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeSubmenus(button);
      setSub(button, open);
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        closeSubmenus(button);
        setSub(button, true);
        document.getElementById(button.getAttribute('aria-controls')!)?.querySelector('a')?.focus();
      }
    });
  });
  mobile.addEventListener('click', () => {
    const open = mobile.getAttribute('aria-expanded') !== 'true';
    mobile.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('ibx-open', open);
    if (!open) closeSubmenus();
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const active = toggles.find(button => button.getAttribute('aria-expanded') === 'true');
    if (active) { closeSubmenus(); active.focus(); }
    else if (mobile.getAttribute('aria-expanded') === 'true') { closeMobile(); mobile.focus(); }
  });
  document.addEventListener('click', event => {
    if (event.target instanceof Node && !header.contains(event.target)) closeMobile();
  });
  header.addEventListener('focusout', () => {
    setTimeout(() => { if (!header.contains(document.activeElement)) closeMobile(); }, 0);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobile));
  media.addEventListener('change', closeMobile);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNavigation, { once: true });
else initNavigation();
document.addEventListener('astro:page-load', initNavigation);
