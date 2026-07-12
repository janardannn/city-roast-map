"use client";

import { useState } from "react";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function joinWaitlist(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    try {
      const response = await fetch("/api/participate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "waitlist", email, city, source: "waitlist-page" }),
      });
      if (!response.ok) throw new Error("Could not join");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="waitlist-shell">
      <div className="waitlist-grid" aria-hidden="true" />
      <header className="waitlist-topbar">
        <a className="brand" href="/" aria-label="Back to Namma Roast">
          <span className="brand-mark">🔥</span>
          <span>NAMMA ROAST</span>
          <em>BLR BETA</em>
        </a>
        <a className="back-to-map" href="/">← PEEK AT THE MAP</a>
      </header>

      <section className="waitlist-main">
        <div className="waitlist-copy">
          <p className="waitlist-kicker"><span /> PRIVATE BETA · BENGALURU FIRST</p>
          <h1>THE CITY IS<br /><em>NOT READY.</em></h1>
          <p>We’re sharpening the roasts, arguing over rent data, and preparing the group-chat damage. Join the list and we’ll email you when Namma Roast drops publicly.</p>
          <div className="release-line"><span>01</span><p><strong>Bengaluru launches first.</strong><br />More cities unlock from waitlist demand.</p></div>
        </div>

        <div className="waitlist-card">
          {status === "done" ? (
            <div className="waitlist-success" role="status">
              <span>✓</span>
              <p>YOU’RE IN</p>
              <h2>SEE YOU AT<br />THE DROP.</h2>
              <small>We’ll email <strong>{email}</strong> when the public release is ready.</small>
              <a href="/">GO GET ROASTED ANYWAY →</a>
            </div>
          ) : (
            <form onSubmit={joinWaitlist}>
              <p className="form-number">WAITLIST / 001</p>
              <h2>CLAIM EARLY<br />ACCESS.</h2>
              <label htmlFor="waitlist-email">YOUR EMAIL</label>
              <input id="waitlist-email" type="email" placeholder="you@somewhere.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <label htmlFor="waitlist-city">YOUR CITY</label>
              <input id="waitlist-city" type="text" placeholder="Bengaluru" value={city} onChange={(event) => setCity(event.target.value)} required />
              <button type="submit" disabled={status === "saving"}>{status === "saving" ? "ADDING YOU…" : "PUT ME ON THE LIST →"}</button>
              {status === "error" && <p className="waitlist-error" role="alert">That didn’t land. Try once more.</p>}
              <small>No spam. One launch email, then only useful chaos.</small>
            </form>
          )}
        </div>
      </section>

      <footer className="waitlist-footer">
        <span>SWALPA WAIT MAADI.</span>
        <span>PUBLIC DROP → SOON</span>
      </footer>
    </main>
  );
}
