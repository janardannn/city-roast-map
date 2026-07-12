import { actionGeneric, anyApi, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireApiToken } from "./lib/auth";

export const getJobPayload = queryGeneric({
  args: { apiToken: v.string(), jobId: v.id("researchJobs") },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status === "deleted") return null;
    const person = await ctx.db.get(job.waitlistId);
    if (!person) return null;
    return {
      jobId: job._id,
      name: person.name,
      locality: person.locality,
      linkedinUrl: person.linkedinUrl,
      xUrl: person.xUrl,
      requestedPlatforms: job.requestedPlatforms,
    };
  },
});

export const markProcessing = mutationGeneric({
  args: { apiToken: v.string(), jobId: v.id("researchJobs"), now: v.number() },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status !== "queued") return false;
    await ctx.db.patch(job._id, { status: "processing", attempts: job.attempts + 1, updatedAt: args.now });
    return true;
  },
});

export const completeJob = mutationGeneric({
  args: {
    apiToken: v.string(),
    jobId: v.id("researchJobs"),
    roastText: v.string(),
    generator: v.string(),
    evidence: v.array(v.object({
      platform: v.string(),
      sourceUrl: v.string(),
      fact: v.string(),
      category: v.string(),
      adapter: v.string(),
      allowedForRoast: v.boolean(),
    })),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status === "deleted") return false;
    for (const item of args.evidence) {
      await ctx.db.insert("researchEvidence", { researchJobId: job._id, ...item, capturedAt: args.now });
    }
    await ctx.db.insert("personalizedRoasts", {
      researchJobId: job._id,
      waitlistId: job.waitlistId,
      locality: job.locality,
      roastText: args.roastText,
      generator: args.generator,
      safetyStatus: "approved",
      createdAt: args.now,
    });
    await ctx.db.patch(job._id, { status: "ready", updatedAt: args.now });
    return true;
  },
});

export const markUnavailable = mutationGeneric({
  args: { apiToken: v.string(), jobId: v.id("researchJobs"), reason: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status === "deleted") return false;
    await ctx.db.patch(job._id, { status: "awaiting_provider", error: args.reason.slice(0, 300), updatedAt: args.now });
    return true;
  },
});

export const processJob = actionGeneric({
  args: { apiToken: v.string(), jobId: v.id("researchJobs") },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const now = Date.now();
    const claimed = await ctx.runMutation(anyApi.research.markProcessing, { ...args, now });
    if (!claimed) return { status: "skipped" };
    const payload = await ctx.runQuery(anyApi.research.getJobPayload, args);
    if (!payload) return { status: "skipped" };

    const mode = process.env.HERMES_ADAPTER_MODE ?? "disabled";
    if (mode === "mock") {
      const sourceUrl = payload.linkedinUrl ?? payload.xUrl ?? "https://city-roast-map.example/locality";
      await ctx.runMutation(anyApi.research.completeJob, {
        ...args,
        now: Date.now(),
        generator: "hermes-mock-v1",
        roastText: `${payload.name} moved to ${payload.locality} and somehow made paying Bangalore rent sound like a personality trait.`,
        evidence: [{
          platform: payload.linkedinUrl ? "linkedin" : payload.xUrl ? "x" : "locality",
          sourceUrl,
          fact: "Demo signal generated from the submitted profile type and locality only.",
          category: "demo",
          adapter: "mock",
          allowedForRoast: true,
        }],
      });
      return { status: "ready", mode: "mock" };
    }

    const webhook = process.env.HERMES_RESEARCH_WEBHOOK_URL;
    const workerToken = process.env.HERMES_WORKER_TOKEN;
    if (mode !== "live" || !webhook || !workerToken) {
      await ctx.runMutation(anyApi.research.markUnavailable, { ...args, now: Date.now(), reason: "Hermes provider is not configured" });
      return { status: "awaiting_provider" };
    }

    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${workerToken}` },
        body: JSON.stringify({
          ...payload,
          policy: {
            submittedUrlsOnly: true,
            excludeSensitiveTraits: true,
            excludePreciseLocation: true,
            requireSourceProvenance: true,
          },
        }),
      });
      if (!response.ok) throw new Error(`Hermes returned ${response.status}`);
      const result = await response.json() as { roastText: string; evidence: Array<{ platform: string; sourceUrl: string; fact: string; category: string; adapter: string; allowedForRoast: boolean }> };
      await ctx.runMutation(anyApi.research.completeJob, { ...args, now: Date.now(), generator: "hermes-live-v1", roastText: result.roastText, evidence: result.evidence });
      return { status: "ready", mode: "live" };
    } catch (error) {
      await ctx.runMutation(anyApi.research.markUnavailable, { ...args, now: Date.now(), reason: error instanceof Error ? error.message : "Hermes request failed" });
      return { status: "awaiting_provider" };
    }
  },
});
