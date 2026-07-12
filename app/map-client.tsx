"use client";

import { useEffect, useMemo, useState } from "react";
import { geoCentroid, geoMercator, geoPath } from "d3-geo";

type Neighborhood = {
  id: string;
  name: string;
  ward: string;
  kicker: string;
  roast: string;
  rent: string;
  commute: string;
  food: string;
  heat: number;
  votes: number;
  shares: number;
  accent: string;
};

type GeoFeature = {
  type: "Feature";
  properties: { KGISWardName?: string };
  geometry: GeoJSON.Geometry;
};

type GeoCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

const neighborhoods: Neighborhood[] = [
  {
    id: "hsr",
    name: "HSR Layout",
    ward: "HSR - Singasandra",
    kicker: "27th Main seed round",
    roast:
      "₹35K for a 1BHK so you can overhear three seed rounds before your Asha Tiffins order lands. 27th Main has more pivots than parking spots.",
    rent: "₹30–35K / 1BHK chatter",
    commute: "ORR-close. CBD emotionally unavailable.",
    food: "Asha Tiffins → 27th Main cold brew",
    heat: 96,
    votes: 2841,
    shares: 964,
    accent: "#FF5B43",
  },
  {
    id: "koramangala",
    name: "Koramangala",
    ward: "Koramangala",
    kicker: "5th Block runway",
    roast:
      "₹90K for a 3BHK, and the Ejipura flyover still has the longer runway. In 5th Block, the café changes concept before the founder changes the deck.",
    rent: "₹90K / 3BHK sighting",
    commute: "Sony World turns + Ejipura archaeology",
    food: "5th Block cafés, pubs, one more ‘concept’",
    heat: 99,
    votes: 3617,
    shares: 1288,
    accent: "#FFB800",
  },
  {
    id: "indiranagar",
    name: "Indiranagar",
    ward: "Hoysala Nagar",
    kicker: "100 Feet, zero parking",
    roast:
      "100 Feet Road: ₹45K rent, ₹500 pints, zero feet of parking. Every bungalow became a bar; every dosa became content.",
    rent: "₹45K / 2BHK is ‘normal’",
    commute: "Metro good. Parking mythical.",
    food: "Toit → ghee queue on 12th Main",
    heat: 97,
    votes: 3144,
    shares: 1102,
    accent: "#78D7FF",
  },
  {
    id: "whitefield",
    name: "Whitefield",
    ward: "Whitefield",
    kicker: "Hope Farm time zone",
    roast:
      "Whitefield got a metro so residents can finally visit Bengaluru. Hope Farm still decides when.",
    rent: "₹34–40K / gated 2BHK chatter",
    commute: "2 km off ITPL can become 30 min",
    food: "Kanpurwale, Sorse & ITPL back-gate carts",
    heat: 94,
    votes: 2459,
    shares: 812,
    accent: "#A886FF",
  },
  {
    id: "jayanagar",
    name: "Jayanagar",
    ward: "Ashoka Pillar",
    kicker: "Location kodbedi",
    roast:
      "Ten blocks, one Cool Joint sandwich, and unlimited speeches about how Bengaluru peaked in 1998. Location kodbedi.",
    rent: "₹35K furnished 2BHK sighting",
    commute: "Green Line good. Whitefield: 90 min.",
    food: "Cool Joint grilled sandwich + gudbud",
    heat: 91,
    votes: 1988,
    shares: 701,
    accent: "#57D68D",
  },
  {
    id: "malleswaram",
    name: "Malleswaram",
    ward: "Malleswaram",
    kicker: "Breakfast constitution",
    roast:
      "Sankey gossip, CTR queues and 8th Cross shopping—Old Bengaluru running a tighter schedule than your startup.",
    rent: "Building age decides everything",
    commute: "Tech corridor: 60–90 min each way",
    food: "CTR dose, Veena idli, then debate",
    heat: 89,
    votes: 1754,
    shares: 659,
    accent: "#FF8DC7",
  },
  {
    id: "bellandur",
    name: "Bellandur",
    ward: "Bellanduru",
    kicker: "Ecospace escape room",
    roast:
      "You moved next to Ecospace to avoid traffic. Now getting out of Ecospace is the commute.",
    rent: "₹35K-ish / 1BHK near office",
    commute: "30 min can mean ‘exiting Ecospace’",
    food: "Team lunch at The Bay—ORR says stay",
    heat: 95,
    votes: 2216,
    shares: 776,
    accent: "#65E6D1",
  },
  {
    id: "btm",
    name: "BTM Layout",
    ward: "BTM Layout",
    kicker: "Silk Board survivor",
    roast:
      "11th Main feeds you in ten minutes; Udupi Garden signal keeps you for dessert. Silk Board is the final boss.",
    rent: "₹16–25K / 1BHK chatter",
    commute: "Yellow Line up. Silk Board final boss.",
    food: "Darshini breakfast, 11th Main world tour",
    heat: 92,
    votes: 1863,
    shares: 633,
    accent: "#FF8A65",
  },
];

const wardToNeighborhood = new Map(neighborhoods.map((n) => [n.ward, n]));

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default function Home() {
  const [selectedId, setSelectedId] = useState("hsr");
  const [geo, setGeo] = useState<GeoCollection | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [modal, setModal] = useState<"signup" | "defend" | "city" | null>(null);
  const [pendingVote, setPendingVote] = useState(false);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [voteLift, setVoteLift] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const selected = neighborhoods.find((n) => n.id === selectedId) ?? neighborhoods[0];

  useEffect(() => {
    fetch("/data/bangalore-wards.geojson")
      .then((response) => response.json())
      .then((data: GeoCollection) => setGeo(data))
      .catch(() => setGeo(null));

    fetch("/api/participate")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data?.signedIn && setSignedIn(true))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mapData = useMemo(() => {
    if (!geo) return null;
    const projection = geoMercator().fitExtent(
      [
        [24, 24],
        [716, 560],
      ],
      geo as unknown as GeoJSON.FeatureCollection,
    );
    const path = geoPath(projection);
    const paths = geo.features.map((feature) => ({
      feature,
      d: path(feature as unknown as GeoJSON.Feature) ?? "",
    }));
    const labels = neighborhoods
      .map((neighborhood) => {
        const feature = geo.features.find(
          (item) => item.properties.KGISWardName === neighborhood.ward,
        );
        if (!feature) return null;
        const point = projection(geoCentroid(feature as unknown as GeoJSON.Feature));
        return point ? { neighborhood, x: point[0], y: point[1] } : null;
      })
      .filter(Boolean) as { neighborhood: Neighborhood; x: number; y: number }[];
    return { paths, labels };
  }, [geo]);

  function showToast(text: string) {
    setToast(text);
  }

  async function postParticipation(payload: Record<string, string>) {
    const response = await fetch("/api/participate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Could not save that yet");
    return response.json();
  }

  async function castVote() {
    if (voted[selected.id]) return;
    if (!signedIn) {
      setPendingVote(true);
      setModal("signup");
      return;
    }
    try {
      await postParticipation({ action: "vote", neighborhood: selected.id });
      setVoted((current) => ({ ...current, [selected.id]: true }));
      setVoteLift((current) => ({
        ...current,
        [selected.id]: (current[selected.id] ?? 0) + 1,
      }));
      showToast("Your vote is in. The roast survives another round.");
    } catch {
      showToast("Couldn’t save the vote. Try once more.");
    }
  }

  async function signup(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) return;
    try {
      await postParticipation({ action: "signup", email, neighborhood: selected.id });
      setSignedIn(true);
      setModal(null);
      showToast(`Welcome to the ${selected.name} defence committee.`);
      if (pendingVote) {
        setPendingVote(false);
        await postParticipation({ action: "vote", neighborhood: selected.id });
        setVoted((current) => ({ ...current, [selected.id]: true }));
        setVoteLift((current) => ({
          ...current,
          [selected.id]: (current[selected.id] ?? 0) + 1,
        }));
      }
    } catch {
      showToast("Signup didn’t land. Give it another go.");
    }
  }

  async function submitNote(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    if (!signedIn) {
      setModal("signup");
      return;
    }
    const action = modal === "city" ? "city" : "defend";
    try {
      await postParticipation({ action, neighborhood: selected.id, message });
      setMessage("");
      setModal(null);
      showToast(action === "city" ? "City request logged." : "Defence entered into evidence.");
    } catch {
      showToast("Couldn’t save that yet. Try again.");
    }
  }

  async function shareRoast() {
    const shareText = `${selected.name}: ${selected.roast}`;
    const url = `${window.location.origin}/?hood=${selected.id}&ref=share`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${selected.name} got roasted`, text: shareText, url });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        showToast("Roast link copied. Choose violence responsibly.");
      }
    } catch {
      // Native share sheets can be dismissed without an error state.
    }
  }

  function nextNeighborhood() {
    const index = neighborhoods.findIndex((n) => n.id === selected.id);
    setSelectedId(neighborhoods[(index + 1) % neighborhoods.length].id);
  }

  return (
    <main className="site-shell arcade-map" style={{ "--hood-accent": selected.accent } as React.CSSProperties}>
      <div className="noise" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Namma Roast home">
          <span className="brand-mark" aria-hidden="true">🔥</span>
          <span>NAMMA<br />ROAST</span>
        </a>
        <div className="city-switcher" aria-label="Current city">
          <span className="live-dot" />
          LIVE FROM BLR
        </div>
        <p className="map-edition">MAP EDITION · 2026</p>
      </header>

      <section className="playground" id="top" aria-label="Bengaluru neighborhood roast map">
        <aside className="intro-panel">
          <div>
            <p className="eyebrow"><span>★</span> BANGALORE HAS OPINIONS</p>
            <h1>NAMMA<br /><em>MAP</em></h1>
            <p className="hero-note">Pick your area. Bangalore tribalism needs data.</p>
          </div>
          <div className="intro-actions">
            <div className="map-roast-meter">
              <div><span>ROAST LEVEL</span><b>DANGEROUSLY LOCAL</b></div>
              <p aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></p>
            </div>
            <button onClick={nextNeighborhood}>RANDOM AREA <span>▶</span></button>
          </div>
        </aside>

        <div className="map-stage">
          <div className="map-toolbar">
            <div>
              <p className="panel-label">PLAYER 01 / PICK YOUR AREA</p>
              <p className="map-hint">Bangalore tribalism needs coordinates</p>
            </div>
            <div className="legend"><span /> PRESS START</div>
          </div>
          <div className="map-wrap">
            <div className="radar-ring ring-one" aria-hidden="true" />
            <div className="radar-ring ring-two" aria-hidden="true" />
            {mapData ? (
              <svg
                className="bangalore-map"
                viewBox="0 0 740 585"
                role="img"
                aria-label="Interactive Bengaluru ward map with eight highlighted neighborhoods"
              >
                <title>Bengaluru neighbourhood roast map</title>
                <desc>Select a highlighted ward to read its roast card.</desc>
                <g className="ward-layer">
                  {mapData.paths.map(({ feature, d }, index) => {
                    const hood = wardToNeighborhood.get(feature.properties.KGISWardName ?? "");
                    const isSelected = hood?.id === selected.id;
                    return (
                      <path
                        key={`${feature.properties.KGISWardName}-${index}`}
                        d={d}
                        className={hood ? `ward featured-ward ${isSelected ? "selected" : ""}` : "ward"}
                        style={hood && isSelected ? { fill: selected.accent } : undefined}
                        onClick={hood ? () => setSelectedId(hood.id) : undefined}
                        aria-label={hood ? `Select ${hood.name}` : undefined}
                      />
                    );
                  })}
                </g>
                <g className="label-layer">
                  {mapData.labels.map(({ neighborhood, x, y }) => {
                    const active = neighborhood.id === selected.id;
                    return (
                      <g
                        className={`map-label ${active ? "active" : ""}`}
                        key={neighborhood.id}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => setSelectedId(neighborhood.id)}
                        role="button"
                        aria-label={`Open ${neighborhood.name} roast`}
                      >
                        <circle r={active ? 8 : 5} />
                        <text y={-12}>{neighborhood.name.toUpperCase()}</text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            ) : (
              <div className="map-loading" aria-live="polite">LOCATING THE DRAMA…</div>
            )}
            <div className="map-coordinate">12.9716° N · 77.5946° E</div>
            <div className="map-tip"><span>↖</span> choose violence</div>
          </div>
        </div>

        <article className="roast-card">
          <div className="card-topline">
            <span className="card-index">#{String(neighborhoods.findIndex((n) => n.id === selected.id) + 1).padStart(2, "0")}</span>
            <span className="accuracy"><i /> {selected.heat}% MATCH</span>
          </div>
          <div className="hood-title">
            <p>{selected.kicker}</p>
            <h2>{selected.name}</h2>
          </div>
          <div className="roast-quote">{selected.roast}</div>
          <div className="signal-list">
            <div><span>₹</span><p>RENT</p><strong>{selected.rent}</strong></div>
            <div><span>⌛</span><p>COMMUTE</p><strong>{selected.commute}</strong></div>
            <div><span>☕</span><p>LOCAL LORE</p><strong>{selected.food}</strong></div>
          </div>
          <div className="vote-row">
            <button className={`vote-button ${voted[selected.id] ? "is-voted" : ""}`} onClick={() => void castVote()}>
              {voted[selected.id] ? "✓ I FELT THAT" : "OOF. TOO ACCURATE"}
            </button>
            <span>{formatCount(selected.votes + (voteLift[selected.id] ?? 0))}<small>locals felt attacked</small></span>
          </div>
          <div className="card-actions">
            <button className="share-action" onClick={() => void shareRoast()}>SEND TO GROUP CHAT <span>↗</span></button>
            <button onClick={() => setModal(signedIn ? "defend" : "signup")}>NAH, DEFEND MY HOOD</button>
          </div>
          <div className="card-footer">
            <span>{formatCount(selected.shares)} forwards</span>
            <button onClick={nextNeighborhood}>NEXT ROAST →</button>
          </div>
        </article>

        <nav className="hood-dock" aria-label="Choose a neighborhood">
          <span className="dock-label">PICK YOUR HOOD</span>
          <div className="hood-tabs">
            {neighborhoods.map((neighborhood) => (
              <button
                key={neighborhood.id}
                className={neighborhood.id === selected.id ? "active" : ""}
                onClick={() => setSelectedId(neighborhood.id)}
              >
                {neighborhood.name}
              </button>
            ))}
          </div>
        </nav>
      </section>

      <section className="city-pulse">
        <div className="pulse-title"><span>●</span> RIGHT NOW IN THE GROUP CHAT</div>
        <div className="pulse-item"><strong>HSR</strong><span>most defended</span><em>2,841 votes</em></div>
        <div className="pulse-item"><strong>KORAMANGALA</strong><span>starting fights</span><em>1,288 shares</em></div>
        <div className="pulse-item"><strong>WHITEFIELD</strong><span>still loading…</span><em>ETA unknown</em></div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">🔥</span><span>NAMMA ROAST</span></div>
        <p>MADE IN BENGALURU TRAFFIC</p>
        <div className="footer-links"><a href="/waitlist">JOIN WAITLIST</a><a href="https://projects.datameet.org/Municipal_Spatial_Data/bangalore/" target="_blank" rel="noreferrer">MAP DATA ↗</a></div>
      </footer>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close">×</button>
            {modal === "signup" ? (
              <form onSubmit={signup}>
                <p className="modal-kicker">CLAIM YOUR CORNER</p>
                <h2 id="modal-title">VOTE LIKE A LOCAL.</h2>
                <p>Sign up to vote, defend {selected.name}, and get fresh ammunition when the roast changes.</p>
                <label htmlFor="email">EMAIL</label>
                <input id="email" type="email" placeholder="you@bengaluru.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
                <button className="modal-submit" type="submit">ENTER THE GROUP CHAT →</button>
                <small>No spam. Only neighbourhood slander.</small>
              </form>
            ) : (
              <form onSubmit={submitNote}>
                <p className="modal-kicker">{modal === "city" ? "TAKE THIS CHAOS HOME" : "LOCAL CORRECTION DESK"}</p>
                <h2 id="modal-title">{modal === "city" ? "WHICH CITY IS NEXT?" : `DEFEND ${selected.name.toUpperCase()}.`}</h2>
                <p>{modal === "city" ? "Name the city and the one stereotype we absolutely cannot miss." : "Tell us what only a resident would know. Good corrections make sharper roasts."}</p>
                <label htmlFor="message">{modal === "city" ? "CITY + LOCAL TRUTH" : "YOUR DEFENCE"}</label>
                <textarea id="message" placeholder={modal === "city" ? "Mumbai — Bandra believes the sea view is a personality…" : "Actually, the real problem is…"} value={message} onChange={(event) => setMessage(event.target.value)} required autoFocus />
                <button className="modal-submit" type="submit">SUBMIT TO THE EDITORS →</button>
              </form>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
