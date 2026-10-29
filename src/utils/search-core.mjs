export const normalise = value => String(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
export function searchEntries(entries, query, language) {
  const phrase = normalise(query);
  if (!phrase) return [];
  const words = [...new Set(phrase.split(' '))];
  return entries.filter(entry => language === 'all' || entry.lang === language).map(entry => {
    const title = normalise(entry.title);
    const body = normalise(entry.text);
    const haystack = `${title} ${body}`;
    if (!words.every(word => haystack.includes(word))) return null;
    const score = (title === phrase ? 100 : 0) + (title.includes(phrase) ? 40 : 0)
      + words.reduce((sum, word) => sum + (title.includes(word) ? 12 : 1), 0)
      + (body.includes(phrase) ? 5 : 0) + (entry.url.includes('#') ? 2 : 0);
    return { ...entry, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));
}
export function excerpt(text, query, length = 180) {
  const source = String(text).replace(/\s+/g, ' ').trim();
  const word = normalise(query).split(' ')[0];
  const match = normalise(source).indexOf(word);
  const start = Math.max(0, match - 45);
  return `${start > 0 ? '…' : ''}${source.slice(start, start + length)}${source.length > start + length ? '…' : ''}`;
}
