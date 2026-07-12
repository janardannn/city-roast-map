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
    kicker: "Founder habitat",
    roast:
      "Rent of a Mumbai 2BHK. Vibe of a hackathon that never ends. Forty minutes from anything with trees.",
    rent: "₹42–58K / 2BHK",
    commute: "45 min to Indiranagar*",
    food: "Third Wave within 300m",
    heat: 96,
    votes: 2841,
    shares: 964,
    accent: "#FF5B43",
  },
  {
    id: "koramangala",
    name: "Koramangala",
    ward: "Koramangala",
    kicker: "Pitch deck district",
    roast:
      "Every table is a board meeting, every dog has a LinkedIn, and your landlord just raised rent after reading TechCrunch.",
    rent: "₹48–70K / 2BHK",
    commute: "12 min to another cafe*",
    food: "Meghana is the town hall",
    heat: 99,
    votes: 3617,
    shares: 1288,
    accent: "#FFB800",
  },
  {
    id: "indiranagar",
    name: "Indiranagar",
    ward: "Hoysala Nagar",
    kicker: "Main-character main road",
    roast:
      "Pays premium rent to hear three pubs and a superbike at once. Calls 100 Feet Road ‘walkable’ with a straight face.",
    rent: "₹50–75K / 2BHK",
    commute: "1 hour to Whitefield*",
    food: "One tasting menu per pothole",
    heat: 97,
    votes: 3144,
    shares: 1102,
    accent: "#78D7FF",
  },
  {
    id: "whitefield",
    name: "Whitefield",
    ward: "Whitefield",
    kicker: "Bengaluru, technically",
    roast:
      "A gated community, a tech park and a mall in a trench coat pretending to be a neighbourhood.",
    rent: "₹36–55K / 2BHK",
    commute: "Pack an overnight bag*",
    food: "Brunch, but inside a mall",
    heat: 94,
    votes: 2459,
    shares: 812,
    accent: "#A886FF",
  },
  {
    id: "jayanagar",
    name: "Jayanagar",
    ward: "Ashoka Pillar",
    kicker: "South Bengaluru royalty",
    roast:
      "Judges your life choices before the filter coffee cools. Still thinks anything north of Richmond Road is a day trip.",
    rent: "₹35–50K / 2BHK",
    commute: "Metro superiority complex",
    food: "Breakfast has a fan club",
    heat: 91,
    votes: 1988,
    shares: 701,
    accent: "#57D68D",
  },
  {
    id: "malleswaram",
    name: "Malleswaram",
    ward: "Malleswaram",
    kicker: "Old Bengaluru energy",
    roast:
      "Your startup can wait. The dosa queue cannot. Has survived three generations of people spelling it differently.",
    rent: "₹32–48K / 2BHK",
    commute: "Measures distance in bus stops",
    food: "CTR discourse is civic duty",
    heat: 89,
    votes: 1754,
    shares: 659,
    accent: "#FF8DC7",
  },
  {
    id: "bellandur",
    name: "Bellandur",
    ward: "Bellanduru",
    kicker: "Lake-view-ish living",
    roast:
      "Chose the office-adjacent life, then discovered the office is still forty-five minutes away on Outer Ring Road.",
    rent: "₹38–58K / 2BHK",
    commute: "ORR decides your destiny",
    food: "Cloud kitchens know you by name",
    heat: 95,
    votes: 2216,
    shares: 776,
    accent: "#65E6D1",
  },
  {
    id: "btm",
    name: "BTM Layout",
    ward: "BTM Layout",
    kicker: "The sensible compromise",
    roast:
      "Moved here to save rent. Spends the difference on autos to Koramangala and tells everyone it’s basically next door.",
    rent: "₹28–42K / 2BHK",
    commute: "Silk Board is a personality test",
    food: "One shawarma per square metre",
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
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="City Roast Map home">
          <span className="brand-mark">CR</span>
          <span>CITY ROAST MAP</span>
        </a>
        <div className="city-switcher" aria-label="Current city">
          <span className="live-dot" />
          BENGALURU
          <span className="city-count">01 / 01</span>
        </div>
        <button className="nav-action" onClick={() => setModal("city")}>
          REQUEST YOUR CITY ↗
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">THE LOCALS-ONLY MAP OF BENGALURU</p>
          <h1>
            CHOOSE YOUR AREA.<br />
            <span>GET PERSONALLY ATTACKED.</span>
          </h1>
          <p className="hero-note">
            Rents, commute pain and food lore—turned into the roast your group chat was already writing.
          </p>
        </div>
        <div className="hero-stamp" aria-label="Roasts refined by local votes">
          <span>LOCAL VOTES</span>
          <strong>→</strong>
          <span>SHARPER ROASTS</span>
        </div>
      </section>

      <section className="experience" aria-label="Bengaluru neighborhood roast map">
        <div className="map-panel">
          <div className="map-toolbar">
            <div>
              <p className="panel-label">BENGALURU / NEIGHBOURHOOD HEAT</p>
              <p className="map-hint">Tap a labelled ward to pick a fight</p>
            </div>
            <div className="legend"><span /> ROASTED ZONES</div>
          </div>
          <div className="map-wrap">
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
                        className={hood ? "ward featured-ward" : "ward"}
                        style={hood ? { fill: isSelected ? selected.accent : "#7656D6" } : undefined}
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
                        <circle r={active ? 7 : 5} />
                        <text y={-11}>{neighborhood.name.toUpperCase()}</text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            ) : (
              <div className="map-loading" aria-live="polite">LOADING BENGALURU’S BOUNDARIES…</div>
            )}
            <div className="map-coordinate">12.9716° N / 77.5946° E</div>
          </div>
        </div>

        <article className="roast-card" style={{ "--hood-accent": selected.accent } as React.CSSProperties}>
          <div className="card-topline">
            <span>ROAST NO. {String(neighborhoods.findIndex((n) => n.id === selected.id) + 1).padStart(2, "0")}</span>
            <span className="accuracy">{selected.heat}% ACCURATE*</span>
          </div>
          <div className="hood-title">
            <p>{selected.kicker}</p>
            <h2>{selected.name}</h2>
          </div>
          <div className="roast-quote">“{selected.roast}”</div>
          <div className="signal-list">
            <div><span>RENT CHECK</span><strong>{selected.rent}</strong></div>
            <div><span>COMMUTE PAIN</span><strong>{selected.commute}</strong></div>
            <div><span>LOCAL LORE</span><strong>{selected.food}</strong></div>
          </div>
          <div className="vote-row">
            <button className={`vote-button ${voted[selected.id] ? "is-voted" : ""}`} onClick={() => void castVote()}>
              {voted[selected.id] ? "✓ PAINFULLY ACCURATE" : "THIS IS PAINFULLY ACCURATE"}
            </button>
            <span>{formatCount(selected.votes + (voteLift[selected.id] ?? 0))} locals agree</span>
          </div>
          <div className="card-actions">
            <button onClick={() => void shareRoast()}>SHARE THE DAMAGE ↗</button>
            <button onClick={() => setModal(signedIn ? "defend" : "signup")}>DEFEND YOUR HOOD</button>
          </div>
          <div className="card-footer">
            <span>{formatCount(selected.shares)} SHARES</span>
            <span>*COMMUNITY PULSE, NOT A SCIENCE</span>
          </div>
        </article>
      </section>

      <section className="hood-strip" aria-label="Choose a neighborhood">
        <div className="strip-title">
          <span>01</span>
          <strong>PICK YOUR HOOD</strong>
        </div>
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
        <button className="next-button" onClick={nextNeighborhood} aria-label="Next neighborhood">→</button>
      </section>

      <section className="proof-section">
        <div>
          <p className="eyebrow">THE CITY IS KEEPING SCORE</p>
          <h2>ONE MAP.<br />ENDLESS BEEF.</h2>
        </div>
        <div className="proof-grid">
          <div><strong>18.4K</strong><span>DEMO CARD VIEWS</span></div>
          <div><strong>6.9K</strong><span>GROUP CHAT SHARES</span></div>
          <div><strong>37%</strong><span>VISIT → VOTE</span></div>
        </div>
        <div className="source-note">
          <span>DATA DESK</span>
          <p>Ward geometry: BBMP 2022 delimitation via DataMeet. Traffic context: TomTom 2025 Bengaluru index. Rent bands are editorial demo estimates and should be refreshed before launch.</p>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">CR</span><span>CITY ROAST MAP</span></div>
        <p>BUILT WITH LOVE. DELIVERED WITH DISRESPECT.</p>
        <a href="https://projects.datameet.org/Municipal_Spatial_Data/bangalore/" target="_blank" rel="noreferrer">MAP SOURCE ↗</a>
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
