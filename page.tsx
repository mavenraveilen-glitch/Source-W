'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from '@/components/Hero';
import Workspace from '@/components/Workspace';
import type { ExtractResult } from '@/lib/types';

export default function HomePage() {
  const [view, setView] = useState<'hero' | 'workspace'>('hero');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json()) as ExtractResult;
      if (json.status !== 'success' || !json.html) {
        setError(json.message || 'Extraction failed');
        setLoading(false);
        return;
      }
      // Brief cinematic hold so 3D zoom can play
      await new Promise((r) => setTimeout(r, 900));
      setData(json);
      setView('workspace');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setView('hero');
    setData(null);
    setError(null);
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {view === 'hero' && (
          <motion.div
            key="hero"
            className="h-full"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            <Hero onFetch={handleFetch} loading={loading} />
            {error && (
              <div className="absolute bottom-8 left-1/2 z-30 max-w-md -translate-x-1/2 rounded-lg border border-white/20 bg-gray-950 px-4 py-3 text-center text-sm text-gray-300 shadow-glow">
                {error}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-3 cursor-pointer text-xs text-white underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </motion.div>
        )}

        {view === 'workspace' && data && (
          <motion.div
            key="workspace"
            className="h-full"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Workspace data={data} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
