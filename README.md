# Namma Roast / City Roast Map

A Bangalore-first neighborhood roast map with an arcade waitlist, Convex-ready participation backend, and a queued Hermes personalization pipeline.

## Local site

```bash
npm install
npm run dev
```

The public landing page is `/waitlist`. The gated map is `/preview`.

## Backend

The browser only talks to `/api/participate`. When `CONVEX_URL` and `CONVEX_API_TOKEN` are configured, the API uses Convex for waitlist entries, participants, votes, defenses, city requests, research jobs, evidence, and personalized roasts. Without those values, the deployed site keeps D1 as a temporary no-loss fallback.

To connect Convex and the Hermes worker, follow [convex/README.md](convex/README.md). The primary setup commands are:

```bash
npm run convex:dev
npm run convex:deploy
```

## Validation

```bash
npm run build
npm run lint
```

The waitlist requires name, email, Bengaluru locality, and a clear opt-in. LinkedIn and X profile URLs are optional and restricted to canonical public profile URLs. The research job sends only the submitted URLs, name, and locality to the configured worker; it never searches for additional accounts using email.
