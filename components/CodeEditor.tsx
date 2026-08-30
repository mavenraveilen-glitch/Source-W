'use client';

import { useMemo } from 'react';
import { highlight } from '@/lib/highlight';
import type { EditorFile } from '@/lib/types';

type Props = {
  file: EditorFile | null;
};

export default function CodeEditor({ file }: Props) {
  const html = useMemo(() => {
    if (!file) return '';
    return highlight(file.content, file.type);
  }, [file]);

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black text-sm text-gray-600">
        No file selected
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#050505]">
      <div className="flex items-center justify-between border-b border-white/10 bg-gray-950 px-3 py-1.5">
        <span className="text-xs text-gray-400">{file.name}</span>
        <span className="text-[10px] text-gray-600">{file.lines} lines</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <pre
          className="whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-[1.55] text-gray-300"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
