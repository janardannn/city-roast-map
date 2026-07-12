import { env } from "cloudflare:workers";

export function getD1(): D1Database {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return env.DB;
}

export async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS participants (id TEXT PRIMARY KEY, email TEXT NOT NULL, neighborhood TEXT NOT NULL, created_at INTEGER NOT NULL)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS participants_email_idx ON participants(email)"),
    db.prepare("CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, participant_id TEXT NOT NULL, neighborhood TEXT NOT NULL, created_at INTEGER NOT NULL)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS votes_participant_neighborhood_idx ON votes(participant_id, neighborhood)"),
    db.prepare("CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, participant_id TEXT NOT NULL, neighborhood TEXT NOT NULL, message TEXT NOT NULL, created_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS city_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, participant_id TEXT NOT NULL, message TEXT NOT NULL, created_at INTEGER NOT NULL)"),
  ]);
}
