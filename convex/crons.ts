import { anyApi, cronJobs } from "convex/server";

const crons = cronJobs();

// Retention cleanup is intentionally installed with the backend. The dispatcher
// itself is scheduled immediately by waitlist.join so signups do not wait for a cron tick.
crons.daily("expire old research data", { hourUTC: 3, minuteUTC: 15 }, anyApi.retention.expireResearch);

export default crons;
