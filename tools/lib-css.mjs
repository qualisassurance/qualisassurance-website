/** Minimal CSS rule splitter. Keeps at-rules whole; normalises whitespace only. */
export function parseRules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  let depth = 0, buf = '';
  for (const c of css) {
    buf += c;
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { rules.push(buf.trim()); buf = ''; }
  }
  return rules.filter(Boolean).map(norm);
}
export const norm = (r) =>
  r.replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim();
export const selectorOf = (r) => r.slice(0, r.indexOf('{'));
export const bodyOf = (r) => r.slice(r.indexOf('{') + 1, r.lastIndexOf('}'));

/** Effective property map per selector (later declarations win). At-rules skipped. */
export function effective(rules) {
  const m = new Map();
  for (const r of rules) {
    const sel = selectorOf(r);
    if (sel.startsWith('@')) continue;
    const cur = m.get(sel) ?? new Map();
    for (const d of bodyOf(r).split(';')) {
      const i = d.indexOf(':');
      if (i > 0) cur.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
    m.set(sel, cur);
  }
  return m;
}
