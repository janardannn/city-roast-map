import { mutationGeneric } from "convex/server";

export const expireResearch = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const jobs = await ctx.db.query("researchJobs").collect();
    let deleted = 0;
    for (const job of jobs) {
      if (job.expiresAt > now || job.status === "deleted") continue;
      const evidence = await ctx.db.query("researchEvidence").withIndex("by_job", (q) => q.eq("researchJobId", job._id)).collect();
      const roasts = await ctx.db.query("personalizedRoasts").withIndex("by_job", (q) => q.eq("researchJobId", job._id)).collect();
      for (const item of evidence) await ctx.db.delete(item._id);
      for (const roast of roasts) await ctx.db.delete(roast._id);
      await ctx.db.patch(job._id, { status: "deleted", updatedAt: now, error: undefined });
      deleted += 1;
    }
    return { deleted };
  },
});
