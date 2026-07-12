export function requireApiToken(value: string) {
  const expected = process.env.CONVEX_API_TOKEN;
  if (!expected || value !== expected) throw new Error("Unauthorized backend call");
}
