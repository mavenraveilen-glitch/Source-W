# Source W

World-class web source code extractor and previewer.

**Extract. Preview. Build.**

## Features

- **Real server-side extraction** via `/api/extract` (bypasses CORS)
- Parses HTML with Cheerio, fetches linked CSS & JS
- Syntax-highlighted editor + file tree
- Live sandboxed preview (`srcdoc`)
- ZIP download (JSZip)
- Volumetric Three.js hero (wireframe lattice, bloom, particles, fog, parallax)

## Stack

- Next.js 14 (App Router)
- React Three Fiber + Drei + postprocessing (Bloom)
- Framer Motion
- Cheerio, JSZip
- Tailwind CSS (strict black / white / gray)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

```bash
npx vercel
```

Or push to GitHub and import the repo in Vercel — zero extra config.

## API

`POST /api/extract`

```json
{ "url": "https://example.com" }
```

Response:

```json
{
  "status": "success",
  "html": "<!DOCTYPE html>...",
  "css": [{ "url": "...", "name": "style.css", "content": "...", "lines": 42 }],
  "js": [{ "url": "...", "name": "app.js", "content": "...", "lines": 10 }],
  "title": "Example",
  "finalUrl": "https://example.com/"
}
```

Private/localhost targets are blocked (SSRF guard). Requests time out at 10s.
