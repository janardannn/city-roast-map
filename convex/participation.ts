import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireApiToken } from "./lib/auth";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type ParticipantContext = Pick<MutationCtx, "db"> | Pick<QueryCtx, "db">;

async function participantByToken(ctx: ParticipantContext, token: string) {
  return ctx.db.query("participants").withIndex("by_token", (q) => q.eq("token", token)).unique();
}

export const getSession = queryGeneric({
  args: { apiToken: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const participant = await participantByToken(ctx, args.token);
    return { signedIn: Boolean(participant), neighborhood: participant?.neighborhood ?? null };
  },
});

export const signup = mutationGeneric({
  args: { apiToken: v.string(), proposedToken: v.string(), email: v.string(), neighborhood: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db.query("participants").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { neighborhood: args.neighborhood, updatedAt: args.now });
      return { token: existing.token };
    }
    await ctx.db.insert("participants", {
      token: args.proposedToken,
      email,
      neighborhood: args.neighborhood,
      createdAt: args.now,
      updatedAt: args.now,
    });
    return { token: args.proposedToken };
  },
});

export const castVote = mutationGeneric({
  args: { apiToken: v.string(), token: v.string(), neighborhood: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const participant = await participantByToken(ctx, args.token);
    if (!participant) throw new Error("Signup required");
    const existing = await ctx.db.query("votes").filter((q) => q.and(
      q.eq(q.field("participantId"), participant._id),
      q.eq(q.field("neighborhood"), args.neighborhood),
    )).unique();
    if (!existing) await ctx.db.insert("votes", { participantId: participant._id, neighborhood: args.neighborhood, createdAt: args.now });
    return { inserted: !existing };
  },
});

export const submitDefense = mutationGeneric({
  args: { apiToken: v.string(), token: v.string(), neighborhood: v.string(), message: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const participant = await participantByToken(ctx, args.token);
    if (!participant) throw new Error("Signup required");
    await ctx.db.insert("submissions", { participantId: participant._id, neighborhood: args.neighborhood, message: args.message, createdAt: args.now });
    return { ok: true };
  },
});

export const requestCity = mutationGeneric({
  args: { apiToken: v.string(), token: v.string(), message: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    requireApiToken(args.apiToken);
    const participant = await participantByToken(ctx, args.token);
    if (!participant) throw new Error("Signup required");
    await ctx.db.insert("cityRequests", { participantId: participant._id, message: args.message, createdAt: args.now });
    return { ok: true };
  },
});
