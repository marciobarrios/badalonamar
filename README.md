# BadalonaMar

BadalonaMar is a mobile-first Catalan web app for daily local usefulness around Canyado, Casagemes, Centre, and the nearby Badalona seafront.

The MVP is a compact "Avui" app, not a marketing site. It brings together weather, beach status, local news, monthly events, and curated recommendations in one phone-friendly surface.

## Features

- **Avui**: weather, nearest beach summary, next event, and BDNCom news.
- **Platges**: summer beach status from the Ajuntament de Badalona beach endpoint.
- **Agenda**: current-month events parsed from the official city agenda.
- **Recomanacions**: curated local places, shops, restaurants, and creators.
- **Supabase-ready**: client/server helpers and env placeholders are included for future submissions, votes, auth, and moderation.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn-style local UI primitives
- Base UI tabs
- Supabase SSR/client scaffolding
- Vitest parser tests

## Data Sources

The app uses server-side adapters so external source parsing stays isolated from the UI.

- Weather: `https://www.badalona.cat/@@aemet_view?set_language=ca`
- Beaches: `https://www.badalona.cat/@@beaches_view?set_language=ca`
- News: `https://www.bdncom.cat/ca`
- Events: `https://www.badalona.cat/ca/actualitat/agenda`
- Recommendations: curated local data in `src/lib/recommendations.ts`

Beach data is shown as an active section from June 1 to September 30. Outside that window, the app keeps the section but explains that the bathing season is inactive.

Source adapters cache successful parsed results in the Next.js Data Cache: news for 15 minutes, agenda for 1 hour, weather for 30 minutes, and beach status for 20 minutes. Upstream requests inside these caches use `no-store` so raw HTML/JSON does not add another freshness window. Agenda parsing is shared across months of the same inferred year; month filtering and beach season checks still run per request.

The four source APIs allow shared caching only for the remaining source lifetime, with immediate browser revalidation. Errors are handled outside the data cache and return `Cache-Control: no-store`. If a background refresh fails, Next.js retains the last successful value; expired values are labeled `stale` and are not shared-cacheable. Default-month agenda responses and beach responses also expire before their calendar boundary. Curated recommendations keep their existing behavior.

Cache keys include a parser version (`v1`); bump it when changing parsing or normalization semantics. The cache tests exercise Next.js's real incremental cache with isolated in-memory storage and mocked upstream responses.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Supabase is optional for the MVP. To enable it later, copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The app runs without these values today.

## Scripts

```bash
pnpm dev        # Start local development
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
pnpm test       # Vitest parser tests
```

## Project Structure

```text
src/app/                  App Router routes and API routes
src/components/           Mobile app shell and UI primitives
src/lib/sources/          Source adapters and parser tests
src/lib/supabase/         Optional Supabase client/server helpers
src/lib/recommendations.ts Curated recommendation data
PRODUCT.md                Product context
DESIGN.md                 Design context
```

## Verification

Before pushing changes, run:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## Notes

- The app is Catalan-only for now.
- News uses a server-side BDNCom adapter and links to BDNCom's WhatsApp channel, but it does not ingest private WhatsApp summaries.
- Community features such as adding, voting, and moderating recommendations are intentionally deferred until the Supabase schema is introduced.
