# Website Asset Extractor

Next.js MVP that scans public websites and extracts downloadable media assets (images, video, audio, SVG, files).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Cheerio HTML parsing + optional Playwright rendering (local / non-Vercel)

## Development

```bash
cd website-asset-extractor
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

- `POST /api/scan` — `{ "url": "https://example.com", "stream": true }`
- `POST /api/download` — `{ "scanId", "url" }`
- `POST /api/download-zip` — `{ "scanId", "assetIds"?: string[] }`

## Vercel

Serverless-friendly: static fetch + Cheerio by default. Playwright is skipped on Vercel (`VERCEL=1`) because full browser binaries are not available in standard serverless functions.

## Security

SSRF protections block private networks, localhost, and cloud metadata hosts. Downloads are limited to URLs from the active in-memory scan session.
