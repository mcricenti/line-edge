# Line Edge

Sports betting mispricing scanner + research-backed strategy desk.

Live site scans **The Odds API** for:

- Cross-book **arbitrage**
- **Soft vs sharp (Pinnacle)** gaps
- **Best-price / line-shopping** edges

Strategies are documented on the site from the local research library (Sharper, Logic of Sports Betting, Fortune’s Formula, Trading Bases, Mathletics, Buchdahl, Thaler/Sauer/Dixon–Coles, etc.).

## Quick start

```bash
cd web
npm install
npm run dev
```

Open the scanner, paste a free API key from [the-odds-api.com](https://the-odds-api.com/), and scan.

## Deploy

```bash
cd web
npm run build
npx wrangler deploy
```

Or publish `web/dist` to any static host (GitHub Pages, Netlify, Cloudflare).

## Repo layout

- `web/` — Vite + React app
- `owned-strategies-and-people.md` — strategy extract from owned sources
- `missing-sources-context-pack.md` — library gap checklist
- `library/` — local copies of books/papers (gitignored)

## Disclaimer

Not financial advice. Betting may be illegal where you live. Edges are fragile; academic literature finds many apparent inefficiencies do not survive costs and data mining.
