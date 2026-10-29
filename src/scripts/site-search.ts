import { searchEntries, excerpt } from '../utils/search-core.mjs';
type Entry = { title: string; url: string; text: string; lang: string; };
function initSearch() {
  const page = document.querySelector<HTMLElement>('[data-ibx-search-page]');
  if (!page || page.dataset.ready) return;
  page.dataset.ready = 'true';
  const en = page.dataset.language === 'en';
  const form = page.querySelector<HTMLFormElement>('form')!;
  const input = form.querySelector<HTMLInputElement>('input[name="q"]')!;
  const all = form.querySelector<HTMLInputElement>('input[name="all"]')!;
  const status = page.querySelector<HTMLElement>('.ibx-results-status')!;
  const list = page.querySelector<HTMLOListElement>('.ibx-results-list')!;
  const more = page.querySelector<HTMLButtonElement>('.ibx-more')!;
  const text = (zh: string, english: string) => en ? english : zh;
  let indexPromise: Promise<Entry[]> | undefined;
  let matches: Entry[] = [];
  let shown = 0;
  let sequence = 0;
  let currentQuery = '';
  async function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch('/ib-search-index.json').then(async response => {
        if (!response.ok) throw new Error('Index unavailable');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid index');
        return data.filter(entry => typeof entry.title === 'string' && typeof entry.text === 'string' && /^\/(?!\/)/.test(entry.url));
      }).catch(error => { indexPromise = undefined; throw error; });
    }
    return indexPromise;
  }
  function showBatch() {
    const next = matches.slice(shown, shown + 20);
    const firstNew = shown;
    next.forEach(entry => {
      const li = document.createElement('li');
      const heading = document.createElement('h2');
      const link = document.createElement('a');
      link.href = entry.url;
      link.textContent = entry.title;
      heading.append(link);
      const meta = document.createElement('p');
      meta.className = 'ibx-result-meta';
      meta.textContent = `${entry.lang === 'en' ? 'English' : '繁體中文'} · ${entry.url}`;
      const snippet = document.createElement('p');
      snippet.textContent = excerpt(entry.text, currentQuery);
      li.append(heading, meta, snippet);
      list.append(li);
    });
    shown += next.length;
    more.hidden = shown >= matches.length;
    return firstNew;
  }
  async function run(updateUrl: boolean) {
    const request = ++sequence;
    const query = input.value.trim().slice(0, 160);
    currentQuery = query;
    list.replaceChildren(); more.hidden = true; matches = []; shown = 0;
    if (updateUrl) {
      const url = new URL(location.href);
      url.search = '';
      if (query) url.searchParams.set('q', query);
      if (all.checked) url.searchParams.set('all', '1');
      history.pushState({}, '', url);
    }
    const languageLink = document.querySelector<HTMLAnchorElement>('.ibx-language');
    if (languageLink) {
      const target = new URL(en ? '/search/' : '/en/search/', location.origin);
      if (query) target.searchParams.set('q', query);
      if (all.checked) target.searchParams.set('all', '1');
      languageLink.href = target.pathname + target.search;
    }
    if (!query) {
      page.removeAttribute('aria-busy');
      status.textContent = text('請輸入關鍵字，例如「心理學」或「IELTS」。', 'Enter a keyword, such as “psychology” or “IELTS”.');
      return;
    }
    status.textContent = text('正在搜尋…', 'Searching…');
    page.setAttribute('aria-busy', 'true');
    try {
      const entries = await loadIndex();
      if (request !== sequence) return;
      matches = searchEntries(entries, query, all.checked ? 'all' : (en ? 'en' : 'zh'));
      status.textContent = matches.length
        ? text(`找到 ${matches.length} 筆符合「${query}」的結果。`, `${matches.length} results for “${query}”.`)
        : text('找不到符合的結果。請換個關鍵字，或勾選同時搜尋繁中及英文。', 'No results. Try another keyword or include both languages.');
      showBatch();
    } catch {
      if (request === sequence) status.textContent = text('搜尋資料暫時無法載入，請再次按「搜尋」重試。', 'Search is temporarily unavailable. Press Search to try again.');
    } finally { if (request === sequence) page.removeAttribute('aria-busy'); }
  }
  function fromUrl() {
    const params = new URLSearchParams(location.search);
    input.value = (params.get('q') || '').slice(0, 160);
    all.checked = params.get('all') === '1';
    void run(false);
  }
  form.addEventListener('submit', event => { event.preventDefault(); void run(true); });
  all.addEventListener('change', () => { void run(true); });
  more.addEventListener('click', () => {
    const next = showBatch();
    list.children[next]?.querySelector('a')?.focus();
  });
  window.addEventListener('popstate', fromUrl);
  fromUrl();
}
initSearch();
document.addEventListener('astro:page-load', initSearch);
