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
      content: data.html,
      lines: data.html.split(/\r\n|\r|\n/).length,
      url: data.finalUrl,
    },
  ];
  data.css.forEach((c, i) => {
    files.push({
      id: `css-${i}`,
      name: c.name,
      type: 'css',
      content: c.content,
      lines: c.lines,
      url: c.url,
    });
  });
  data.js.forEach((j, i) => {
    files.push({
      id: `js-${i}`,
      name: j.name,
      type: 'js',
      content: j.content,
      lines: j.lines,
      url: j.url,
    });
  });
  return files;
}

export default function Workspace({ data, onBack }: Props) {
  const files = useMemo(() => buildFiles(data), [data]);
  const [activeId, setActiveId] = useState(files[0]?.id ?? '');
  const [downloading, setDownloading] = useState(false);

  const active = files.find((f) => f.id === activeId) ?? files[0] ?? null;

  const downloadZip = useCallback(async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const host = (() => {
        try {
          return new URL(data.finalUrl || 'https://site').hostname.replace(/\./g, '-');
        } catch {
          return 'source-w';
        }
      })();
      const folder = zip.folder(host) || zip;
      for (const f of files) {
        folder.file(f.name, f.content);
      }
      folder.file(
        'README.txt',
        `Extracted by Source W\nURL: ${data.finalUrl || ''}\nTitle: ${data.title || ''}\nDate: ${new Date().toISOString()}\nFiles: ${files.length}\n`
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${host}-source.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }, [data, files]);

  let domain = '';
  try {
    domain = new URL(data.finalUrl || '').hostname;
  } catch {
    domain = data.finalUrl || '';
  }

  return (
    <div className="flex h-full flex-col bg-black">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-gray-950 px-3 py-2 shadow-glow">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-sm font-extrabold text-black shadow-glow">
            W
          </div>
          <span className="text-sm font-semibold tracking-tight">Source W</span>
          {domain && (
            <span className="hidden max-w-[160px] truncate text-xs text-gray-500 sm:inline">
              {domain}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-md border border-white/20 bg-transparent px-3 text-xs font-semibold text-gray-300 transition-all duration-200 hover:border-white/40 hover:bg-gray-900 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            New
          </button>
          <button
            type="button"
            onClick={downloadZip}
            disabled={downloading}
            className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-md bg-white px-3 text-xs font-semibold text-black shadow-glow transition-all duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {downloading ? 'Packing…' : 'Download ZIP'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
          <div className="hidden md:flex">
            <FileTree files={files} activeId={active?.id ?? ''} onSelect={setActiveId} />
          </div>
          {/* Mobile file tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 bg-gray-950 px-2 py-1 md:hidden">
            {files.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveId(f.id)}
                className={`shrink-0 cursor-pointer rounded px-2 py-1 text-[11px] transition-colors ${
                  f.id === active?.id ? 'bg-white/15 text-white' : 'text-gray-500'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <CodeEditor file={active} />
        </div>
        <div className="flex min-h-[40%] min-w-0 flex-1 flex-col md:min-h-0 md:max-w-[45%]">
          <LivePreview files={files} />
        </div>
      </div>
    </div>
  );
}
