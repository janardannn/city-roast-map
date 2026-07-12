import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Namma Roast waitlist with the requested fields", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/waitlist/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /NAMMA/);
  assert.match(page, /ROAST/);
  assert.match(page, /BANGALORE HAS OPINIONS/);
  assert.match(page, /name="name"/);
  assert.match(page, /name="email"/);
  assert.match(page, /name="locality"/);
  assert.match(page, /name="linkedinUrl"/);
  assert.match(page, /name="xUrl"/);
  assert.match(page, /public profiles I submit/i);
  assert.doesNotMatch(page, /TEAM ACCESS/);
  assert.match(layout, /Namma Roast — Bangalore Has Opinions/);
});

test("ships Convex storage and a queued Hermes adapter", async () => {
  const [schema, waitlist, research, route] = await Promise.all([
    readFile(new URL("../convex/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../convex/waitlist.ts", import.meta.url), "utf8"),
    readFile(new URL("../convex/research.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/participate/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /waitlistEntries/);
  assert.match(schema, /researchJobs/);
  assert.match(schema, /researchEvidence/);
  assert.match(schema, /personalizedRoasts/);
  assert.match(waitlist, /scheduler\.runAfter/);
  assert.match(research, /HERMES_RESEARCH_WEBHOOK_URL/);
  assert.match(research, /submittedUrlsOnly:\s*true/);
  assert.match(route, /joinConvexWaitlist/);
  assert.match(route, /linkedin_url/);
  assert.match(route, /x_url/);
});
