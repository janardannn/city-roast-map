# Convex + Hermes setup

This folder is the production-ready Convex backend for the waitlist, map participation, research queue, evidence provenance, retention, and personalized roasts.

## Connect a Convex project

1. Run `npm run convex:dev` and choose a local deployment or sign in to a Convex team.
2. Set `CONVEX_API_TOKEN` in the Convex deployment with `npx convex env set CONVEX_API_TOKEN <value>`.
3. Put the same token and the generated `.convex.cloud` URL into the site runtime as `CONVEX_API_TOKEN` and `CONVEX_URL`.
4. Deploy production functions with `npm run convex:deploy`.

Until both site-side values exist, the live site keeps its current D1 database as a no-loss fallback. Once configured, all new waitlist and participation writes use Convex.

## Hermes worker contract

Every waitlist signup creates and immediately schedules a `researchJobs` document. Research only uses the public LinkedIn/X URLs the person submitted plus their chosen locality. The worker payload intentionally excludes email.

Set `HERMES_ADAPTER_MODE=mock` to test the full queue/result path without a provider. For a real worker, set `HERMES_ADAPTER_MODE=live`, `HERMES_RESEARCH_WEBHOOK_URL`, and `HERMES_WORKER_TOKEN` in the Convex deployment.

The webhook receives:

```json
{
  "jobId": "...",
  "name": "Asha",
  "locality": "Indiranagar",
  "linkedinUrl": "https://www.linkedin.com/in/...",
  "xUrl": "https://x.com/...",
  "requestedPlatforms": ["linkedin", "x", "locality"],
  "policy": {
    "submittedUrlsOnly": true,
    "excludeSensitiveTraits": true,
    "excludePreciseLocation": true,
    "requireSourceProvenance": true
  }
}
```

It must synchronously return:

```json
{
  "roastText": "A playful personalized roast.",
  "evidence": [
    {
      "platform": "linkedin",
      "sourceUrl": "https://www.linkedin.com/in/...",
      "fact": "Publicly describes themselves as a product manager.",
      "category": "public_bio",
      "adapter": "hermes-linkedin-v1",
      "allowedForRoast": true
    }
  ]
}
```

Do not return raw HTML, private contact data, precise addresses, sensitive traits, relatives, or information from accounts the person did not submit. Research evidence and generated roasts expire after 30 days.

