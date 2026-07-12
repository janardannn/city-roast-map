export function normalizeLinkedInUrl(value?: string) {
  if (!value) return undefined;
  const url = new URL(value.trim());
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.protocol !== "https:" || host !== "linkedin.com" || !url.pathname.startsWith("/in/")) {
    throw new Error("Use a public LinkedIn profile URL");
  }
  url.hostname = "www.linkedin.com";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function normalizeXUrl(value?: string) {
  if (!value) return undefined;
  const url = new URL(value.trim());
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.protocol !== "https:" || !["x.com", "twitter.com"].includes(host)) {
    throw new Error("Use a public X profile URL");
  }
  const handle = url.pathname.split("/").filter(Boolean)[0];
  if (!handle || !/^[A-Za-z0-9_]{1,15}$/.test(handle)) throw new Error("Use a public X profile URL");
  url.hostname = "x.com";
  url.pathname = `/${handle}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
