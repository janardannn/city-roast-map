import { anyApi, mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { requireApiToken } from "./lib/auth";
import { normalizeLinkedInUrl, normalizeXUrl } from "./lib/profileUrls";

export const join = mutationGeneric({
  args: {
    apiToken: v.string(),
    name: v.string(),
    email: v.string(),
    city: v.string(),
    locality: v.string(),
    linkedinUrl: v.optional(v.string()),
    xUrl: v.optional(v.string()),
    source: v.string(),
    consentVersion: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const email = args.email.trim().toLowerCase();
    const linkedinUrl = normalizeLinkedInUrl(args.linkedinUrl);
    const xUrl = normalizeXUrl(args.xUrl);
    const existing = await ctx.db.query("waitlistEntries").withIndex("by_email", (q) => q.eq("email", email)).unique();
    const values = {
      name: args.name.trim(),
      email,
      city: args.city,
      locality: args.locality,
      linkedinUrl,
      xUrl,
      source: args.source,
      consentVersion: args.consentVersion,
      updatedAt: args.now,
    };
    let waitlistId;
    if (existing) {
      await ctx.db.patch(existing._id, values);
      waitlistId = existing._id;
    } else {
      waitlistId = await ctx.db.insert("waitlistEntries", { ...values, createdAt: args.now });
    }

    const priorJobs = await ctx.db.query("researchJobs").withIndex("by_waitlist", (q) => q.eq("waitlistId", waitlistId)).collect();
    for (const job of priorJobs) {
      if (!["ready", "deleted"].includes(job.status)) await ctx.db.patch(job._id, { status: "deleted", updatedAt: args.now });
    }

    const requestedPlatforms = [linkedinUrl ? "linkedin" : null, xUrl ? "x" : null, "locality"].filter(Boolean) as string[];
    const jobId = await ctx.db.insert("researchJobs", {
      waitlistId,
      locality: args.locality,
      status: "queued",
      requestedPlatforms,
      attempts: 0,
      mode: process.env.HERMES_ADAPTER_MODE ?? "disabled",
      createdAt: args.now,
      updatedAt: args.now,
      expiresAt: args.now + 30 * 24 * 60 * 60 * 1000,
    });
    await ctx.scheduler.runAfter(0, anyApi.research.processJob, { apiToken: args.apiToken, jobId });
    return { waitlistId, researchJobId: jobId, status: "queued" };
  },
});
