import { ensureSchema, getD1 } from "../../../db";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "city_roast_participant";
const validNeighborhoods = new Set([
  "hsr",
  "koramangala",
  "indiranagar",
  "whitefield",
  "jayanagar",
  "malleswaram",
  "bellandur",
  "btm",
]);

function participantFromRequest(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export async function GET(request: Request) {
  const participantId = participantFromRequest(request);
  if (!participantId) return json({ signedIn: false });

  try {
    const db = getD1();
    await ensureSchema(db);
    const person = await db
      .prepare("SELECT id, neighborhood FROM participants WHERE id = ? LIMIT 1")
      .bind(participantId)
      .first<{ id: string; neighborhood: string }>();
    return json({ signedIn: Boolean(person), neighborhood: person?.neighborhood ?? null });
  } catch {
    return json({ signedIn: false });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const action = typeof body.action === "string" ? body.action : "";
  const neighborhood =
    typeof body.neighborhood === "string" && validNeighborhoods.has(body.neighborhood)
      ? body.neighborhood
      : "hsr";

  try {
    const db = getD1();
    await ensureSchema(db);

    if (action === "waitlist") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
      const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "Bengaluru";
      const source = typeof body.source === "string" ? body.source.trim().slice(0, 80) : "waitlist-page";
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
      const area = typeof body.area === "string" ? body.area.trim().slice(0, 100) : "";
      const profileUrl = typeof body.profile === "string" ? body.profile.trim().slice(0, 400) : "";
      const consentVersion = body.consent === "true" ? "2026-07-12-v1" : "";
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Valid email required" }, 400);
      if (!name || !area || !consentVersion) return json({ error: "Name, area and consent required" }, 400);

      await db
        .prepare("INSERT INTO waitlist (id, email, city, source, name, area, profile_url, consent_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET city = excluded.city, source = excluded.source, name = excluded.name, area = excluded.area, profile_url = excluded.profile_url, consent_version = excluded.consent_version")
        .bind(crypto.randomUUID(), email, city || "Bengaluru", source || "waitlist-page", name, area, profileUrl || null, consentVersion, Date.now())
        .run();
      return json({ ok: true });
    }

    if (action === "signup") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Valid email required" }, 400);

      const existing = await db
        .prepare("SELECT id FROM participants WHERE email = ? LIMIT 1")
        .bind(email)
        .first<{ id: string }>();
      const participantId = existing?.id ?? crypto.randomUUID();
      if (!existing) {
        await db
          .prepare("INSERT INTO participants (id, email, neighborhood, created_at) VALUES (?, ?, ?, ?)")
          .bind(participantId, email, neighborhood, Date.now())
          .run();
      } else {
        await db.prepare("UPDATE participants SET neighborhood = ? WHERE id = ?").bind(neighborhood, participantId).run();
      }

      return json(
        { ok: true },
        200,
        { "set-cookie": `${COOKIE_NAME}=${encodeURIComponent(participantId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000` },
      );
    }

    const participantId = participantFromRequest(request);
    if (!participantId) return json({ error: "Signup required" }, 401);

    const participant = await db
      .prepare("SELECT id FROM participants WHERE id = ? LIMIT 1")
      .bind(participantId)
      .first<{ id: string }>();
    if (!participant) return json({ error: "Signup required" }, 401);

    if (action === "vote") {
      await db
        .prepare("INSERT OR IGNORE INTO votes (participant_id, neighborhood, created_at) VALUES (?, ?, ?)")
        .bind(participantId, neighborhood, Date.now())
        .run();
      return json({ ok: true });
    }

    const message = typeof body.message === "string" ? body.message.trim().slice(0, 800) : "";
    if (!message) return json({ error: "Message required" }, 400);

    if (action === "defend") {
      await db
        .prepare("INSERT INTO submissions (participant_id, neighborhood, message, created_at) VALUES (?, ?, ?, ?)")
        .bind(participantId, neighborhood, message, Date.now())
        .run();
      return json({ ok: true });
    }

    if (action === "city") {
      await db
        .prepare("INSERT INTO city_requests (participant_id, message, created_at) VALUES (?, ?, ?)")
        .bind(participantId, message, Date.now())
        .run();
      return json({ ok: true });
    }

    return json({ error: "Unsupported action" }, 400);
  } catch {
    return json({ error: "Storage unavailable" }, 503);
  }
}
