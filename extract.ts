import * as cheerio from 'cheerio';
import type { ExtractResult, ResourceFile } from './types';

const TIMEOUT_MS = 10000;
const MAX_CSS = 12;
const MAX_JS = 12;
const MAX_BODY = 2_000_000;

const UA =
  'Mozilla/5.0 (compatible; SourceW/1.0; +https://source-w.app) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  const parsed = new URL(u);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }
  return parsed.href;
}

function toAbsolute(base: string, href: string): string | null {
  try {
    if (!href || href.startsWith('data:') || href.startsWith('blob:') || href.startsWith('javascript:')) {
      return null;
    }
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url);
    const base = u.pathname.split('/').filter(Boolean).pop() || fallback;
    return base.split('?')[0] || fallback;
  } catch {
    return fallback;
  }
}

function countLines(text: string): number {
  if (!text) return 0;
  return text.split(/\r\n|\r|\n/).length;
}

async function fetchText(url: string): Promise<{ text: string; finalUrl: string; status: number }> {
  const res = await withTimeout(
    fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      // @ts-expect-error next/node fetch
      signal: undefined,
    }),
    TIMEOUT_MS
  );

  const text = await res.text();
  if (text.length > MAX_BODY) {
    return { text: text.slice(0, MAX_BODY), finalUrl: res.url || url, status: res.status };
  }
  return { text, finalUrl: res.url || url, status: res.status };
}

async function fetchOptional(url: string): Promise<string | null> {
  try {
    const { text, status } = await fetchText(url);
    if (status >= 400) return null;
    return text;
  } catch {
    return null;
  }
}

export async function extractSource(rawUrl: string): Promise<ExtractResult> {
  try {
    const url = normalizeUrl(rawUrl);
    const { text: html, finalUrl, status } = await fetchText(url);

    if (status >= 400) {
      return {
        status: 'error',
        html: '',
        css: [],
        js: [],
        message: `Target returned HTTP ${status}`,
      };
    }

    const $ = cheerio.load(html);
    const base = finalUrl || url;
    const title = $('title').first().text().trim() || undefined;

    const cssUrls: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      const abs = href ? toAbsolute(base, href) : null;
      if (abs && !cssUrls.includes(abs)) cssUrls.push(abs);
    });

    // Inline style blocks collected as virtual files
    const inlineCss: ResourceFile[] = [];
    $('style').each((i, el) => {
      const content = $(el).html() || '';
      if (content.trim()) {
        inlineCss.push({
          url: `${base}#inline-style-${i + 1}`,
          name: `inline-${i + 1}.css`,
          content,
          lines: countLines(content),
        });
      }
    });

    const jsUrls: string[] = [];
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      const abs = src ? toAbsolute(base, src) : null;
      if (abs && !jsUrls.includes(abs)) jsUrls.push(abs);
    });

    const inlineJs: ResourceFile[] = [];
    $('script:not([src])').each((i, el) => {
      const content = $(el).html() || '';
      if (content.trim()) {
        inlineJs.push({
          url: `${base}#inline-script-${i + 1}`,
          name: `inline-${i + 1}.js`,
          content,
          lines: countLines(content),
        });
      }
    });

    const cssFetched = await Promise.all(
      cssUrls.slice(0, MAX_CSS).map(async (u, i) => {
        const content = await fetchOptional(u);
        if (content == null) return null;
        return {
          url: u,
          name: fileNameFromUrl(u, `style-${i + 1}.css`),
          content,
          lines: countLines(content),
        } satisfies ResourceFile;
      })
    );

    const jsFetched = await Promise.all(
      jsUrls.slice(0, MAX_JS).map(async (u, i) => {
        const content = await fetchOptional(u);
        if (content == null) return null;
        return {
          url: u,
          name: fileNameFromUrl(u, `script-${i + 1}.js`),
          content,
          lines: countLines(content),
        } satisfies ResourceFile;
      })
    );

    const css = [...inlineCss, ...(cssFetched.filter(Boolean) as ResourceFile[])];
    const js = [...inlineJs, ...(jsFetched.filter(Boolean) as ResourceFile[])];

    return {
      status: 'success',
      html,
      css,
      js,
      title,
      finalUrl: base,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    return { status: 'error', html: '', css: [], js: [], message };
  }
}
