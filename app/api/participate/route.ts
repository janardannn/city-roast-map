import { ensureSchema, getD1 } from "../../../db";
import {
  castConvexVote,
  getConvexSession,
  isConvexConfigured,
  joinConvexWaitlist,
  requestConvexCity,
  signupConvexParticipant,
  submitConvexDefense,
} from "../../../lib/convex-server";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "city_roast_participant";
const validNeighborhoods = new Set(["hsr", "koramangala", "indiranagar", "whitefield", "jayanagar", "malleswaram", "bellandur", "btm"]);
const validLocalities = new Set([
  "HSR Layout",
  "Koramangala",
  "Indiranagar",
  "Whitefield",
  "Bellandur",
  "Jayanagar",
  "Malleswaram",
  "BTM Layout",
  "Marathahalli",
  "Electronic City",
  "JP Nagar",
  "Banashankari",
  "Hebbal",
  "Yelahanka",
  "Frazer Town",
  "Rajajinagar",
  "Other Bengaluru locality",
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

function optionalProfileUrl(value: unknown, platform: "linkedin" | "x") {
  if (typeof value !== "string" || !value.trim()) return "";
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`Invalid ${platform} URL`);
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const linkedinOk = platform === "linkedin" && host === "linkedin.com" && url.pathname.startsWith("/in/");
  const xHandle = url.pathname.split("/").filter(Boolean)[0] ?? "";
  const xOk = platform === "x" && ["x.com", "twitter.com"].includes(host) && /^[A-Za-z0-9_]{1,15}$/.test(xHandle);
  if (url.protocol !== "https:" || (!linkedinOk && !xOk)) throw new Error(`Invalid ${platform} URL`);
  url.hostname = platform === "linkedin" ? "www.linkedin.com" : "x.com";
  if (platform === "x") url.pathname = `/${xHandle}`;
  url.search = "";
  url.hash = "";
  return url.toString().slice(0, 400);
}

export async function GET(request: Request) {
  const participantId = participantFromRequest(request);
  if (!participantId) return json({ signedIn: false });

  try {
    if (isConvexConfigured()) {
      const session = await getConvexSession(participantId);
      return json(session ?? { signedIn: false });
    }
    const db = getD1();
    await ensureSchema(db);
    const person = await db.prepare("SELECT id, neighborhood FROM participants WHERE id = ? LIMIT 1").bind(participantId).first<{ id: string; neighborhood: string }>();
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
  const neighborhood = typeof body.neighborhood === "string" && validNeighborhoods.has(body.neighborhood) ? body.neighborhood : "hsr";
  const now = Date.now();

  try {
    if (action === "waitlist") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
      const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "Bengaluru";
      const source = typeof body.source === "string" ? body.source.trim().slice(0, 80) : "waitlist-page";
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
      const localityValue = typeof body.locality === "string" ? body.locality.trim().slice(0, 100) : "";
      const locality = validLocalities.has(localityValue) ? localityValue : "";
      const linkedinUrl = optionalProfileUrl(body.linkedinUrl, "linkedin");
      const xUrl = optionalProfileUrl(body.xUrl, "x");
      const consentVersion = body.consent === true || body.consent === "true" ? "2026-07-12-public-profile-roast-v2" : "";
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Valid email required" }, 400);
      if (!name || !locality) return json({ error: "Name and Bengaluru locality required" }, 400);
      if (!consentVersion) return json({ error: "Public-profile research opt-in required" }, 400);

      if (isConvexConfigured()) {
        const result = await joinConvexWaitlist({ name, email, locality, linkedinUrl: linkedinUrl || undefined, xUrl: xUrl || undefined, city: city || "Bengaluru", source, consentVersion, now });
        return json({ ok: true, backend: "convex", researchStatus: (result as { status?: string } | null)?.status ?? "queued" });
      }

      const db = getD1();
      await ensureSchema(db);
      await db.prepare("INSERT INTO waitlist (id, email, city, source, name, area, profile_url, locality, linkedin_url, x_url, consent_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET city = excluded.city, source = excluded.source, name = excluded.name, area = excluded.area, locality = excluded.locality, linkedin_url = excluded.linkedin_url, x_url = excluded.x_url, consent_version = excluded.consent_version")
        .bind(crypto.randomUUID(), email, city || "Bengaluru", source, name, locality, linkedinUrl || xUrl || null, locality, linkedinUrl || null, xUrl || null, consentVersion, now)
        .run();
      return json({ ok: true, backend: "d1-fallback", researchStatus: "awaiting-convex" });
    }

    if (action === "signup") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Valid email required" }, 400);
      let participantId: string;
      if (isConvexConfigured()) {
        const result = await signupConvexParticipant({ proposedToken: crypto.randomUUID(), email, neighborhood, now });
        if (!result) throw new Error("Convex unavailable");
        participantId = result.token;
      } else {
        const db = getD1();
        await ensureSchema(db);
        const existing = await db.prepare("SELECT id FROM participants WHERE email = ? LIMIT 1").bind(email).first<{ id: string }>();
        participantId = existing?.id ?? crypto.randomUUID();
        if (!existing) {
          await db.prepare("INSERT INTO participants (id, email, neighborhood, created_at) VALUES (?, ?, ?, ?)").bind(participantId, email, neighborhood, now).run();
        } else {
          await db.prepare("UPDATE participants SET neighborhood = ? WHERE id = ?").bind(neighborhood, participantId).run();
        }
      }
      return json({ ok: true }, 200, { "set-cookie": `${COOKIE_NAME}=${encodeURIComponent(participantId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000` });
    }

    const participantId = participantFromRequest(request);
    if (!participantId) return json({ error: "Signup required" }, 401);

    if (isConvexConfigured()) {
      const session = await getConvexSession(participantId);
      if (!session?.signedIn) return json({ error: "Signup required" }, 401);
      if (action === "vote") {
        await castConvexVote({ token: participantId, neighborhood, now });
        return json({ ok: true });
      }
      const message = typeof body.message === "string" ? body.message.trim().slice(0, 800) : "";
      if (!message) return json({ error: "Message required" }, 400);
      if (action === "defend") {
        await submitConvexDefense({ token: participantId, neighborhood, message, now });
        return json({ ok: true });
      }
      if (action === "city") {
        await requestConvexCity({ token: participantId, message, now });
        return json({ ok: true });
      }
      return json({ error: "Unsupported action" }, 400);
    }

    const db = getD1();
    await ensureSchema(db);
    const participant = await db.prepare("SELECT id FROM participants WHERE id = ? LIMIT 1").bind(participantId).first<{ id: string }>();
    if (!participant) return json({ error: "Signup required" }, 401);
    if (action === "vote") {
      await db.prepare("INSERT OR IGNORE INTO votes (participant_id, neighborhood, created_at) VALUES (?, ?, ?)").bind(participantId, neighborhood, now).run();
      return json({ ok: true });
    }
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 800) : "";
    if (!message) return json({ error: "Message required" }, 400);
    if (action === "defend") {
      await db.prepare("INSERT INTO submissions (participant_id, neighborhood, message, created_at) VALUES (?, ?, ?, ?)").bind(participantId, neighborhood, message, now).run();
      return json({ ok: true });
    }
    if (action === "city") {
      await db.prepare("INSERT INTO city_requests (participant_id, message, created_at) VALUES (?, ?, ?)").bind(participantId, message, now).run();
      return json({ ok: true });
    }
    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error && /^Invalid (linkedin|x) URL$/.test(error.message) ? error.message : "Storage unavailable";
    return json({ error: message }, message === "Storage unavailable" ? 503 : 400);
  }
}
