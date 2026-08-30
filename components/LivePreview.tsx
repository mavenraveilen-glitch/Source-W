'use client';

import { useMemo } from 'react';
import type { EditorFile } from '@/lib/types';

type Props = {
  files: EditorFile[];
};

export default function LivePreview({ files }: Props) {
  const srcdoc = useMemo(() => {
    const htmlFile = files.find((f) => f.type === 'html');
    if (!htmlFile?.content) return '';

    const css = files
      .filter((f) => f.type === 'css')
      .map((f) => f.content || '')
      .join('\n\n');
    const js = files
      .filter((f) => f.type === 'js')
      .map((f) => f.content || '')
      .join('\n\n');

    let body = htmlFile.content
      .replace(/<link[^>]*rel=["']?stylesheet["'][^>]*>/gi, '')
      .replace(/<script[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');

    const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
    const inject = `<style>${css}</style><script>${safeJs}</script>`;
    if (/<\/body>/i.test(body)) {
      body = body.replace(/<\/body>/i, `${inject}</body>`);
    } else {
      body += inject;
    }
    return body;
  }, [files]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-8 items-center border-b border-white/10 bg-black/40 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          Live Preview
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0a0a]">
        {srcdoc ? (
          <iframe
            title="Live preview"
            className="h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
            srcDoc={srcdoc}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-600">
            Preview will appear here
          </div>
        )}
      </div>
    </div>
  );
}
