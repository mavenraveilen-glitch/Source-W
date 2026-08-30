function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Placeholder-based highlighter so injected spans are never re-matched */
export function highlightHtml(code: string): string {
  let s = escapeHtml(code);
  s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '§C§$1§/C§');
  s = s.replace(/(&lt;\/?)([\w-]+)([^&]*?)(\/?&gt;)/g, (_, open, name, rest, close) => {
    rest = rest.replace(
      /([\w:-]+)(=)(&quot;[^&]*?&quot;)/g,
      '§A§$1§/A§§P§$2§/P§§S§$3§/S§'
    );
    rest = rest.replace(/([\w:-]+)(=)/g, '§A§$1§/A§§P§$2§/P§');
    return `${open}§T§${name}§/T§${rest}${close}`;
  });
  return s
    .replace(/§C§/g, '<span class="tok-comment">')
    .replace(/§\/C§/g, '</span>')
    .replace(/§T§/g, '<span class="tok-tag">')
    .replace(/§\/T§/g, '</span>')
    .replace(/§A§/g, '<span class="tok-attr">')
    .replace(/§\/A§/g, '</span>')
    .replace(/§P§/g, '<span class="tok-punct">')
    .replace(/§\/P§/g, '</span>')
    .replace(/§S§/g, '<span class="tok-string">')
    .replace(/§\/S§/g, '</span>');
}

export function highlightCss(code: string): string {
  let s = escapeHtml(code);
  s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '§C§$1§/C§');
  s = s.replace(/([.#]?[\w-]+)(\s*\{)/g, '§R§$1§/R§$2');
  s = s.replace(/([\w-]+)(\s*:)/g, '§A§$1§/A§§P§$2§/P§');
  s = s.replace(/(:\s*)([^;{}\n]+)/g, '$1§V§$2§/V§');
  return s
    .replace(/§C§/g, '<span class="tok-comment">')
    .replace(/§\/C§/g, '</span>')
    .replace(/§R§/g, '<span class="tok-prop">')
    .replace(/§\/R§/g, '</span>')
    .replace(/§A§/g, '<span class="tok-attr">')
    .replace(/§\/A§/g, '</span>')
    .replace(/§P§/g, '<span class="tok-punct">')
    .replace(/§\/P§/g, '</span>')
    .replace(/§V§/g, '<span class="tok-value">')
    .replace(/§\/V§/g, '</span>');
}

export function highlightJs(code: string): string {
  let s = escapeHtml(code);
  s = s.replace(/(\/\/[^\n]*)/g, '§C§$1§/C§');
  s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '§C§$1§/C§');
  s = s.replace(/(&quot;[^&]*?&quot;|'[^']*?'|`[^`]*?`)/g, '§S§$1§/S§');
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'new', 'this', 'class', 'import', 'export', 'from', 'async', 'await',
    'try', 'catch', 'throw', 'typeof', 'instanceof', 'true', 'false', 'null',
    'undefined', 'switch', 'case', 'break', 'continue', 'default', 'of', 'in',
  ];
  for (const kw of keywords) {
    s = s.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '§K§$1§/K§');
  }
  s = s.replace(/\b(\d+\.?\d*)\b/g, '§N§$1§/N§');
  s = s.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '§F§$1§/F§(');
  return s
    .replace(/§C§/g, '<span class="tok-comment">')
    .replace(/§\/C§/g, '</span>')
    .replace(/§S§/g, '<span class="tok-string">')
    .replace(/§\/S§/g, '</span>')
    .replace(/§K§/g, '<span class="tok-keyword">')
    .replace(/§\/K§/g, '</span>')
    .replace(/§N§/g, '<span class="tok-num">')
    .replace(/§\/N§/g, '</span>')
    .replace(/§F§/g, '<span class="tok-fn">')
    .replace(/§\/F§/g, '</span>');
}

export function highlight(code: string, type: 'html' | 'css' | 'js'): string {
  if (type === 'html') return highlightHtml(code);
  if (type === 'css') return highlightCss(code);
  return highlightJs(code);
}
