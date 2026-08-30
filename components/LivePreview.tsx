'use client';

import { useMemo } from 'react';
import type { EditorFile } from '@/lib/types';

type Props = {
  files: EditorFile[];
};

export default function LivePreview({ files }: Props) {
  const srcdoc = useMemo(() => {
    const htmlFile = files.find((f) => f.type === 'html');
    if (!htmlFile) return '';

    const css = files
      .filter((f) => f.type === 'css')
      .map((f) => f.content)
      .join('\n\n');
    const js = files
      .filter((f) => f.type === 'js')
      .map((f) => f.content)
      .join('\n\n');

    // Strip external stylesheet/script tags that won't resolve in sandbox
    let body = htmlFile.content
      .replace(/<link[^>]*rel=["']?stylesheet["'][^>]*>/gi, '')
      .replace(/<script[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');

    const inject = `<style>${css}</style><script>${js.replace(/<\/script>/gi, '<\\/script>')}</script>`;
    if (/<\/body>/i.test(body)) {
      body = body.replace(/<\/body>/i, `${inject}</body>`);
    } else {
      body += inject;
    }
    return body;
  }, [files]);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-l border-white/10 bg-black">
      <div className="flex h-9 items-center border-b border-white/10 bg-gray-950 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          Live Preview
        </span>
      </div>
      <div className="relative min-h-0 flex-1 shadow-glow-inset">
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
