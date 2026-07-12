import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    neighborhood: text("neighborhood").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("participants_email_idx").on(table.email)],
);

export const votes = sqliteTable(
  "votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    participantId: text("participant_id").notNull(),
    neighborhood: text("neighborhood").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("votes_participant_neighborhood_idx").on(table.participantId, table.neighborhood)],
);

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  participantId: text("participant_id").notNull(),
  neighborhood: text("neighborhood").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const cityRequests = sqliteTable("city_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  participantId: text("participant_id").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const waitlist = sqliteTable(
  "waitlist",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    city: text("city").notNull(),
    source: text("source").notNull(),
    name: text("name"),
    area: text("area"),
    profileUrl: text("profile_url"),
    locality: text("locality"),
    linkedinUrl: text("linkedin_url"),
    xUrl: text("x_url"),
    consentVersion: text("consent_version"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("waitlist_email_idx").on(table.email)],
);
