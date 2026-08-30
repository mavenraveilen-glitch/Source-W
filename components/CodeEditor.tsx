'use client';

import { useMemo } from 'react';
import { highlight } from '@/lib/highlight';
import type { EditorFile } from '@/lib/types';

type Props = {
  file: EditorFile | null;
};

export default function CodeEditor({ file }: Props) {
  const html = useMemo(() => {
    if (!file?.content) return '';
    try {
      return highlight(file.content, file.type);
    } catch {
      return file.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [file]);

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center bg-transparent text-sm text-gray-600">
        No file selected
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-3 py-1.5">
        <span className="truncate text-xs font-medium text-gray-300">{file.name}</span>
        <span className="shrink-0 text-[10px] text-gray-600">{file.lines} lines</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <pre
          className="m-0 whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-[1.55] text-gray-300 sm:text-[12px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
