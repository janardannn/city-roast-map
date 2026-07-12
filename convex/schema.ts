import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  waitlistEntries: defineTable({
    name: v.string(),
    email: v.string(),
    city: v.string(),
    locality: v.string(),
    linkedinUrl: v.optional(v.string()),
    xUrl: v.optional(v.string()),
    source: v.string(),
    consentVersion: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  participants: defineTable({
    token: v.string(),
    email: v.string(),
    neighborhood: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_token", ["token"]).index("by_email", ["email"]),

  votes: defineTable({
    participantId: v.id("participants"),
    neighborhood: v.string(),
    createdAt: v.number(),
  }).index("by_participant_neighborhood", ["participantId", "neighborhood"]).index("by_neighborhood", ["neighborhood"]),

  submissions: defineTable({
    participantId: v.id("participants"),
    neighborhood: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_participant", ["participantId"]).index("by_neighborhood", ["neighborhood"]),

  cityRequests: defineTable({
    participantId: v.id("participants"),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_participant", ["participantId"]),

  researchJobs: defineTable({
    waitlistId: v.id("waitlistEntries"),
    locality: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("awaiting_provider"),
      v.literal("ready"),
      v.literal("failed"),
      v.literal("deleted"),
    ),
    requestedPlatforms: v.array(v.string()),
    attempts: v.number(),
    mode: v.string(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.number(),
  }).index("by_status", ["status"]).index("by_waitlist", ["waitlistId"]),

  researchEvidence: defineTable({
    researchJobId: v.id("researchJobs"),
    platform: v.string(),
    sourceUrl: v.string(),
    fact: v.string(),
    category: v.string(),
    adapter: v.string(),
    capturedAt: v.number(),
    allowedForRoast: v.boolean(),
  }).index("by_job", ["researchJobId"]),

  personalizedRoasts: defineTable({
    researchJobId: v.id("researchJobs"),
    waitlistId: v.id("waitlistEntries"),
    locality: v.string(),
    roastText: v.string(),
    generator: v.string(),
    safetyStatus: v.union(v.literal("approved"), v.literal("rewrite"), v.literal("rejected")),
    createdAt: v.number(),
  }).index("by_job", ["researchJobId"]).index("by_waitlist", ["waitlistId"]),
});
