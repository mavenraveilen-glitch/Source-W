'use client';

import { useCallback, useMemo, useState } from 'react';
import JSZip from 'jszip';
import type { EditorFile, ExtractResult } from '@/lib/types';
import FileTree from './FileTree';
import CodeEditor from './CodeEditor';
import LivePreview from './LivePreview';

type Props = {
  data: ExtractResult;
  onBack: () => void;
};

function buildFiles(data: ExtractResult): EditorFile[] {
  const files: EditorFile[] = [
    {
      id: 'html-0',
      name: 'index.html',
      type: 'html',
      content: data.html || '',
      lines: (data.html || '').split(/\r\n|\r|\n/).length,
      url: data.finalUrl,
    },
  ];
  (data.css || []).forEach((c, i) => {
    files.push({
      id: `css-${i}`,
      name: c.name || `style-${i + 1}.css`,
      type: 'css',
      content: c.content || '',
      lines: c.lines || (c.content || '').split(/\r\n|\r|\n/).length,
      url: c.url,
    });
  });
  (data.js || []).forEach((j, i) => {
    files.push({
      id: `js-${i}`,
      name: j.name || `script-${i + 1}.js`,
      type: 'js',
      content: j.content || '',
      lines: j.lines || (j.content || '').split(/\r\n|\r|\n/).length,
      url: j.url,
    });
  });
  return files;
}

function safeHostname(url?: string): string {
  try {
    return new URL(url || 'https://site').hostname.replace(/[^\w.-]+/g, '-').replace(/\./g, '-');
  } catch {
    return 'source-w';
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function Workspace({ data, onBack }: Props) {
  const files = useMemo(() => buildFiles(data), [data]);
  const [activeId, setActiveId] = useState(files[0]?.id ?? '');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  const active = files.find((f) => f.id === activeId) ?? files[0] ?? null;

  const flashCopied = (key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const downloadZip = useCallback(async () => {
    setDownloading(true);
    setZipError(null);
    try {
      const zip = new JSZip();
      const host = safeHostname(data.finalUrl);
      const folder = zip.folder(host) ?? zip;

      for (const f of files) {
        const name = f.name.replace(/[\\/:*?"<>|]/g, '_') || 'file.txt';
        folder.file(name, f.content ?? '');
      }
      folder.file(
        'README.txt',
        [
          'Extracted by Source W',
          `URL: ${data.finalUrl || ''}`,
          `Title: ${data.title || ''}`,
          `Date: ${new Date().toISOString()}`,
          `Files: ${files.length}`,
          '',
          ...files.map((f) => `- ${f.name} (${f.lines} lines)`),
        ].join('\n')
      );

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${host}-source.zip`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      setZipError(err instanceof Error ? err.message : 'ZIP failed');
    } finally {
      setDownloading(false);
    }
  }, [data, files]);

  const copyActive = useCallback(async () => {
    if (!active?.content) return;
    const ok = await copyText(active.content);
    if (ok) flashCopied('file');
  }, [active]);

  const copyAll = useCallback(async () => {
    const parts = files.map(
      (f) => `/* ===== ${f.name} ===== */\n${f.content ?? ''}`
    );
    const ok = await copyText(parts.join('\n\n'));
    if (ok) flashCopied('all');
  }, [files]);

  let domain = '';
  try {
    domain = new URL(data.finalUrl || '').hostname;
  } catch {
    domain = data.finalUrl || '';
  }

  return (
    <div className="flex h-full flex-col bg-black">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-gray-950/95 px-3 py-2 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-sm font-extrabold text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]">
            W
          </div>
          <span className="text-sm font-semibold tracking-tight">Source W</span>
          {domain && (
            <span className="hidden max-w-[140px] truncate text-xs text-gray-500 sm:inline">
              {domain}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={copyActive}
            disabled={!active}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-white/15 bg-transparent px-2.5 text-[11px] font-semibold text-gray-300 transition-all duration-200 hover:border-white/35 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            {copied === 'file' ? 'Copied' : 'Copy file'}
          </button>
          <button
            type="button"
            onClick={copyAll}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-white/15 bg-transparent px-2.5 text-[11px] font-semibold text-gray-300 transition-all duration-200 hover:border-white/35 hover:bg-white/5 hover:text-white"
          >
            {copied === 'all' ? 'Copied all' : 'Copy all'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-white/20 bg-transparent px-2.5 text-[11px] font-semibold text-gray-300 transition-all duration-200 hover:border-white/40 hover:bg-gray-900 hover:text-white"
          >
            New
          </button>
          <button
            type="button"
            onClick={downloadZip}
            disabled={downloading || files.length === 0}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-white px-3 text-[11px] font-semibold text-black shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_16px_rgba(255,255,255,0.18)] transition-all duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? 'Packing…' : 'Download ZIP'}
          </button>
        </div>
      </header>

      {zipError && (
        <div className="border-b border-white/10 bg-gray-950 px-3 py-1.5 text-center text-xs text-gray-400">
          ZIP error: {zipError}
        </div>
      )}

      {/* Compact dual-panel body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 md:flex-row md:gap-4 md:p-4">
        {/* Left: file tree + code card */}
        <div className="flex min-h-[42%] min-w-0 flex-1 flex-col gap-2 md:min-h-0 md:max-w-[52%]">
          <div className="flex gap-2 overflow-x-auto md:hidden">
            {files.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveId(f.id)}
                className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-200 ${
                  f.id === active?.id
                    ? 'bg-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <div className="hidden md:block">
            <FileTree files={files} activeId={active?.id ?? ''} onSelect={setActiveId} />
          </div>

          {/* Code result — compact glow card */}
          <div
            className="glow-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/15 bg-[#070707]"
            style={{
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.08),
                0 0 20px rgba(180,200,255,0.12),
                0 0 40px rgba(140,160,255,0.06),
                inset 0 1px 0 rgba(255,255,255,0.08),
                inset 0 0 24px rgba(255,255,255,0.02)
              `,
            }}
          >
            <CodeEditor file={active} />
          </div>
        </div>

        {/* Right: live preview — compact glow card */}
        <div
          className="glow-card flex min-h-[40%] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/15 bg-[#070707] md:min-h-0 md:max-w-[48%]"
          style={{
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.08),
              0 0 20px rgba(180,200,255,0.12),
              0 0 40px rgba(140,160,255,0.06),
              inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 0 24px rgba(255,255,255,0.02)
            `,
          }}
        >
          <LivePreview files={files} />
        </div>
      </div>
    </div>
  );
}
