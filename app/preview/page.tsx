import { redirect } from "next/navigation";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

const previewEmails = new Set(["janardanhazarika20@gmail.com", "jorianh25@gmail.com"]);

export default async function PreviewAccessPage() {
  const user = await requireChatGPTUser("/preview");

  if (previewEmails.has(user.email.toLowerCase())) {
    redirect("/");
  }

  return (
    <main className="access-denied-shell">
      <div className="access-denied-card">
        <span>🔒</span>
        <p>PRIVATE BETA</p>
        <h1>NOT ON THE<br />TEAM LIST.</h1>
        <small>Signed in as {user.email}. This account does not have preview access.</small>
        <a href="/waitlist">JOIN THE WAITLIST →</a>
        <a className="signout-link" href={chatGPTSignOutPath("/preview")}>USE ANOTHER ACCOUNT</a>
      </div>
    </main>
  );
}
