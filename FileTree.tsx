'use client';

import type { EditorFile } from '@/lib/types';

type Props = {
  files: EditorFile[];
  activeId: string;
  onSelect: (id: string) => void;
};

const typeIcon: Record<EditorFile['type'], string> = {
  html: 'H',
  css: 'C',
  js: 'J',
};

export default function FileTree({ files, activeId, onSelect }: Props) {
  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-white/10 bg-gray-950/80">
      <div className="border-b border-white/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          Files
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto py-1">
        {files.map((f) => {
          const active = f.id === activeId;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onSelect(f.id)}
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors duration-200 ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold ${
                    active ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {typeIcon[f.type]}
                </span>
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="shrink-0 text-[10px] text-gray-600">{f.lines}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
