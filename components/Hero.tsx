'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';

const VolumetricScene = dynamic(() => import('./VolumetricScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
});

type Props = {
  onFetch: (url: string) => void;
  loading: boolean;
};

export default function Hero({ onFetch, loading }: Props) {
  const [url, setUrl] = useState('');
  const [focused, setFocused] = useState(false);
  const [pulse, setPulse] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = url.trim();
    if (!v || loading) return;
    onFetch(v);
  };

  return (
    <section className="relative flex h-full min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      <VolumetricScene fetching={loading} inputFocused={focused} pulse={pulse} />

      <div
        className={`relative z-10 flex w-full max-w-xl flex-col items-center px-4 text-center transition-opacity duration-500 ${
          loading ? 'pointer-events-none opacity-20' : 'opacity-100'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-xl font-extrabold tracking-tighter text-black shadow-glow-lg">
            W
          </div>
          <span className="text-xl font-bold tracking-tight">Source W</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mb-2 text-4xl font-extrabold tracking-tighter sm:text-5xl"
        >
          Extract. Preview. Build.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 text-base text-gray-400"
        >
          Real source extraction · Live preview · ZIP download
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.52 }}
          onSubmit={submit}
          className="flex w-full overflow-hidden rounded-xl border border-white/20 bg-gray-950 shadow-glow transition-shadow duration-200 focus-within:border-white/40 focus-within:shadow-glow-lg"
        >
          <label htmlFor="url" className="sr-only">
            Website URL
          </label>
          <input
            id="url"
            type="url"
            inputMode="url"
            spellCheck={false}
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-gray-500 disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setPulse(performance.now() / 1000)}
            className="h-auto cursor-pointer whitespace-nowrap bg-white px-5 text-sm font-semibold text-black transition-all duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Fetch Source
          </button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-4 text-xs text-gray-600"
        >
          Server-side extraction · CORS-free · Production ready
        </motion.p>
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/50">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-300">
            Extracting source
          </p>
          <p className="animate-pulse-soft text-xs text-gray-500">Fetching HTML, CSS &amp; JS…</p>
        </div>
      )}
    </section>
  );
}
