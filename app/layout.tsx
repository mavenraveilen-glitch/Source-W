import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Source W — Extract. Preview. Build.',
  description:
    'World-class web source code extractor and previewer. Fetch real HTML, CSS, and JavaScript from any URL.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">{children}</body>
    </html>
  );
}
