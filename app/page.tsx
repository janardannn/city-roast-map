import { env } from "cloudflare:workers";
import { redirect } from "next/navigation";
import { getChatGPTUser } from "./chatgpt-auth";
import MapClient from "./map-client";

export const dynamic = "force-dynamic";

const previewEmails = new Set(["janardanhazarika20@gmail.com"]);

export default async function Home() {
  const runtime = env as unknown as { PUBLIC_RELEASED?: string };
  const isReleased = runtime.PUBLIC_RELEASED === "true";

  if (!isReleased) {
    const user = await getChatGPTUser();
    if (!user || !previewEmails.has(user.email.toLowerCase())) {
      redirect("/waitlist");
    }
  }

  return <MapClient />;
}
