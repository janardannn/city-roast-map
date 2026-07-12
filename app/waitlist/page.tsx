"use client";

import { useState } from "react";

const areas = [
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
];

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [locality, setLocality] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function joinWaitlist(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) return setStatus("error");
    setStatus("saving");
    try {
      const response = await fetch("/api/participate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "waitlist",
          name,
          email,
          locality,
          city: "Bengaluru",
          linkedinUrl,
          xUrl,
          consent,
          source: "arcade-landing",
        }),
      });
      if (!response.ok) throw new Error("Could not join");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setLocality("");
    setLinkedinUrl("");
    setXUrl("");
    setConsent(false);
    setStatus("idle");
  }

  return (
    <main className="arcade-landing">
      <a className="arcade-skip" href="#signup">Skip to signup</a>

      <header className="arcade-topbar">
        <a className="arcade-brand" href="#top" aria-label="Namma Roast home">
          <span className="arcade-brand-fire" aria-hidden="true">🔥</span>
          <span>NAMMA<br />ROAST</span>
        </a>
        <div className="arcade-live"><i aria-hidden="true" /> LIVE FROM BLR</div>
        <p className="arcade-edition">BANGALORE EDITION · 2026</p>
      </header>

      <section className="arcade-stage" id="top">
        <div className="arcade-pixel-grid" aria-hidden="true" />
        <div className="arcade-spotlight arcade-spotlight-left" aria-hidden="true" />
        <div className="arcade-spotlight arcade-spotlight-right" aria-hidden="true" />

        <div className="arcade-headline arcade-stage-item" style={{ "--order": 0 } as React.CSSProperties}>
          <p className="arcade-kicker"><span aria-hidden="true">★</span> BANGALORE HAS OPINIONS</p>
          <h1>NAMMA<br /><span>ROAST</span></h1>
          <p className="arcade-headline-copy">Get roasted by the city you chose to overpay rent in.</p>

          <div className="arcade-meter" aria-label="Tonight's roast level: dangerously local">
            <div className="arcade-meter-label"><span>ROAST LEVEL</span><b>DANGEROUSLY LOCAL</b></div>
            <div className="arcade-meter-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>

        <section className="arcade-console arcade-stage-item" id="signup" style={{ "--order": 1 } as React.CSSProperties} aria-labelledby="signup-title">
          <span className="arcade-corner corner-tl" aria-hidden="true" /><span className="arcade-corner corner-tr" aria-hidden="true" />
          <span className="arcade-corner corner-bl" aria-hidden="true" /><span className="arcade-corner corner-br" aria-hidden="true" />

          <div className="arcade-console-topline"><span>PLAYER 01</span><span className="arcade-blink">{status === "done" ? "PLAYER READY" : "PRESS START"}</span></div>
          {status === "done" ? (
            <section className="arcade-success" aria-live="polite">
              <div className="arcade-success-icon" aria-hidden="true">✓</div>
              <p>PLAYER LOCKED IN</p>
              <h2>YOU ASKED<br />FOR THIS.</h2>
              <p>{name}, {locality} has entered the chat. Your roast is warming up.</p>
              <button type="button" onClick={resetForm}>ADD ANOTHER VICTIM</button>
            </section>
          ) : (
            <>
              <div className="arcade-console-heading">
                <span className="arcade-mini-face" aria-hidden="true">ಠ‿ಠ</span>
                <div><h2 id="signup-title">SIGN UP TO<br />GET ROASTED</h2><p>Three details. One brutal Bangalore verdict.</p></div>
              </div>

              <form onSubmit={joinWaitlist}>
                <label className="arcade-field"><span>01 / WHAT DO WE CALL YOU?</span><input name="name" autoComplete="given-name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required /></label>
                <label className="arcade-field"><span>02 / WHERE DO WE SEND THE DAMAGE?</span><input name="email" type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                <label className="arcade-field"><span>03 / PICK YOUR BANGALORE AREA</span><span className="arcade-select-wrap"><select name="locality" value={locality} onChange={(event) => setLocality(event.target.value)} required><option value="">Choose your area...</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></span></label>

                <details className="arcade-bonus">
                  <summary><span>+ ADD YOUR INTERNET PERSONALITY</span><b>OPTIONAL</b></summary>
                  <label className="arcade-field"><span>LINKEDIN</span><input name="linkedinUrl" type="url" inputMode="url" placeholder="https://linkedin.com/in/..." pattern="https://(www\\.)?linkedin\\.com/in/.*" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} /></label>
                  <label className="arcade-field"><span>X / TWITTER</span><input name="xUrl" type="url" inputMode="url" placeholder="https://x.com/..." pattern="https://(www\\.)?(x\\.com|twitter\\.com)/.*" value={xUrl} onChange={(event) => setXUrl(event.target.value)} /></label>
                </details>

                <label className="arcade-consent"><input name="consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span aria-hidden="true" className="arcade-check" /><span>I opt in to research of the public profiles I submit and my locality to generate a playful personalized roast. No account matching beyond these links.</span></label>
                {status === "error" && <p className="arcade-form-error" role="alert">Check the required fields, profile URLs and opt-in box, guru.</p>}
                <button className="arcade-roast-button" type="submit" disabled={status === "saving"}><span>{status === "saving" ? "LOCKING PLAYER…" : "ROAST ME, BANGALORE"}</span><span aria-hidden="true">▶</span></button>
                <p className="arcade-trust"><span aria-hidden="true">♥</span> Submitted public profiles only. No sensitive traits. Just vibes.</p>
              </form>
            </>
          )}
        </section>

        <div className="arcade-host arcade-stage-item" style={{ "--order": 2 } as React.CSSProperties}>
          <div className="arcade-bubble" aria-hidden="true"><b>SIGNUP KAR!</b><span>Itna kya soch raha hai?</span></div>
          <div className="arcade-host-frame"><img src="/namma-roast-host-laughing-8bit.png" alt="Laughing pixel-art Namma Roast host holding a microphone" /></div>
          <div className="arcade-host-caption"><span>HOST</span> KISHAN · UNFILTERED</div>
          <div className="arcade-laugh" aria-hidden="true">HA HA HA</div>
        </div>
      </section>

      <footer className="arcade-ticker" aria-label="Popular Bangalore roast topics"><div><span>★ TRAFFIC TRAUMA</span><span>★ 400-RUPEE COFFEE</span><span>★ STARTUP DELUSION</span><span>★ RENT EMOTIONAL DAMAGE</span><span>★ AREA WARS</span><span>★ TRAFFIC TRAUMA</span><span>★ 400-RUPEE COFFEE</span><span>★ STARTUP DELUSION</span><span>★ RENT EMOTIONAL DAMAGE</span><span>★ AREA WARS</span></div></footer>
    </main>
  );
}
