function initResourceFilter() {
  const form = document.querySelector<HTMLFormElement>('[data-resource-filter-form]');
  if (!form || form.dataset.ibxReady) return;
  form.dataset.ibxReady = 'true';
  const query = form.querySelector<HTMLInputElement>('[data-resource-search]')!;
  const family = form.querySelector<HTMLSelectElement>('[data-resource-family]')!;
  const subject = form.querySelector<HTMLSelectElement>('[data-resource-subject]')!;
  const cards = [...document.querySelectorAll<HTMLElement>('[data-resource-card]')];
  const count = document.querySelector<HTMLElement>('[data-resource-count]');
  const empty = document.querySelector<HTMLElement>('[data-resource-empty]');
  const params = new URLSearchParams(location.search);
  const en = document.documentElement.lang === 'en';
  const normalise = (value: string) => value.normalize('NFKC').toLocaleLowerCase().trim();
  if ([...family.options].some(option => option.value === params.get('family'))) family.value = params.get('family')!;
  if ([...subject.options].some(option => option.value === params.get('subject'))) subject.value = params.get('subject')!;
  query.value = (params.get('q') || '').slice(0, 160);
  function filter() {
    const terms = normalise(query.value).split(/\s+/).filter(Boolean);
    let total = 0;
    cards.forEach(card => {
      const match = (!family.value || card.dataset.family === family.value)
        && (!subject.value || card.dataset.subject === subject.value)
        && terms.every(term => normalise(card.dataset.search || '').includes(term));
      card.hidden = !match;
      if (match) total++;
    });
    if (count) count.textContent = en ? `${total} results` : `${total} 筆結果`;
    if (empty) empty.hidden = total > 0;
  }
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  form.addEventListener('reset', () => {
    setTimeout(() => {
      const url = new URL(location.href);
      for (const key of ['family', 'subject', 'q']) url.searchParams.delete(key);
      history.replaceState({}, '', url);
      filter();
    }, 0);
  });
  filter();
}
initResourceFilter();
document.addEventListener('astro:page-load', initResourceFilter);
