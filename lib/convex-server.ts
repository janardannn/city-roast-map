import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { env } from "cloudflare:workers";

type RuntimeBindings = {
  CONVEX_URL?: string;
  CONVEX_API_TOKEN?: string;
};

function backend() {
  const bindings = env as unknown as RuntimeBindings;
  const url = bindings.CONVEX_URL?.trim();
  const apiToken = bindings.CONVEX_API_TOKEN?.trim();
  if (!url || !apiToken) return null;
  return { client: new ConvexHttpClient(url), apiToken };
}

export function isConvexConfigured() {
  return backend() !== null;
}

export async function getConvexSession(token: string) {
  const connection = backend();
  if (!connection) return null;
  return connection.client.query(anyApi.participation.getSession, {
    apiToken: connection.apiToken,
    token,
  }) as Promise<{ signedIn: boolean; neighborhood: string | null }>;
}

export async function joinConvexWaitlist(args: {
  name: string;
  email: string;
  locality: string;
  linkedinUrl?: string;
  xUrl?: string;
  city: string;
  source: string;
  consentVersion: string;
  now: number;
}) {
  const connection = backend();
  if (!connection) return null;
  return connection.client.mutation(anyApi.waitlist.join, {
    apiToken: connection.apiToken,
    ...args,
  });
}

export async function signupConvexParticipant(args: {
  proposedToken: string;
  email: string;
  neighborhood: string;
  now: number;
}) {
  const connection = backend();
  if (!connection) return null;
  return connection.client.mutation(anyApi.participation.signup, {
    apiToken: connection.apiToken,
    ...args,
  }) as Promise<{ token: string }>;
}

export async function castConvexVote(args: { token: string; neighborhood: string; now: number }) {
  const connection = backend();
  if (!connection) return null;
  return connection.client.mutation(anyApi.participation.castVote, {
    apiToken: connection.apiToken,
    ...args,
  });
}

export async function submitConvexDefense(args: { token: string; neighborhood: string; message: string; now: number }) {
  const connection = backend();
  if (!connection) return null;
  return connection.client.mutation(anyApi.participation.submitDefense, {
    apiToken: connection.apiToken,
    ...args,
  });
}

export async function requestConvexCity(args: { token: string; message: string; now: number }) {
  const connection = backend();
  if (!connection) return null;
  return connection.client.mutation(anyApi.participation.requestCity, {
    apiToken: connection.apiToken,
    ...args,
  });
}
