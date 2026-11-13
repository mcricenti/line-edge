import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SPORT_PRESETS, fetchOdds } from "../lib/odds";
import { Opportunity, scanAll } from "../lib/mispricing";
import { strategies } from "../data/strategies";

const KEY_STORAGE = "line-edge-odds-api-key";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatPrice(n: number) {
  return n.toFixed(3);
}

export function ScannerPage() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(KEY_STORAGE) ?? ""
  );
  const [sport, setSport] = useState<string>("upcoming");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ops, setOps] = useState<Opportunity[]>([]);
  const [quota, setQuota] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Opportunity["type"]>("all");
  const [eventCount, setEventCount] = useState(0);

  const filtered = useMemo(
    () => (filter === "all" ? ops : ops.filter((o) => o.type === filter)),
    [ops, filter]
  );

  async function runScan() {
    setError(null);
    setLoading(true);
    try {
      const key = apiKey.trim();
      if (!key) throw new Error("Add your The Odds API key to scan live lines.");
      localStorage.setItem(KEY_STORAGE, key);
      const { events, remaining, used } = await fetchOdds({
        apiKey: key,
        sport,
        regions: "us,us2,eu",
        markets: "h2h,spreads,totals",
      });
      setEventCount(events.length);
      setOps(scanAll(events));
      setQuota(
        remaining != null
          ? `API quota: ${remaining} remaining${used ? ` (${used} used)` : ""}`
          : null
      );
    } catch (e) {
      setOps([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>Live line scanner</h1>
        <p>
          Pulls moneyline, spreads, and totals from US + EU books (including
          Pinnacle) via The Odds API, then flags arbitrage, soft-vs-sharp gaps,
          and best-price edges.
        </p>
      </header>

      <div className="scan-panel">
        <label className="field">
          <span>The Odds API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Get a free key at the-odds-api.com"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Sport</span>
          <select value={sport} onChange={(e) => setSport(e.target.value)}>
            {SPORT_PRESETS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" onClick={runScan} disabled={loading}>
          {loading ? "Scanning…" : "Scan lines"}
        </button>
      </div>

      <p className="hint">
        Free API keys:{" "}
        <a href="https://the-odds-api.com/" target="_blank" rel="noreferrer">
          the-odds-api.com
        </a>
        . Key stays in your browser localStorage only.
      </p>

      {error && <div className="banner error">{error}</div>}
      {quota && <p className="muted">{quota}</p>}

      {ops.length > 0 && (
        <>
          <div className="filter-row">
            <p className="muted">
              {filtered.length} opportunities · {eventCount} events
            </p>
            <div className="filters">
              {(
                [
                  ["all", "All"],
                  ["arbitrage", "Arbitrage"],
                  ["sharp-gap", "Sharp gap"],
                  ["best-price", "Best price"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  className={`chip ${filter === id ? "active" : ""}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="opp-list">
            {filtered.map((o) => {
              const strat = strategies.find((s) => s.id === o.strategyId);
              return (
                <article key={o.id} className="opp">
                  <div className="opp-top">
                    <span className={`tag ${o.type}`}>{o.type}</span>
                    <strong className="edge">+{o.edgePct.toFixed(2)}%</strong>
                  </div>
                  <h2>{o.title}</h2>
                  <p className="opp-event">
                    {o.event} · {o.sport} · {formatWhen(o.commence)}
                  </p>
                  <p>{o.detail}</p>
                  <ul className="legs">
                    {o.legs.map((leg, i) => (
                      <li key={`${leg.book}-${leg.outcome}-${i}`}>
                        <span>{leg.book}</span>
                        <span>
                          {leg.outcome}
                          {leg.point !== undefined ? ` ${leg.point}` : ""}
                        </span>
                        <span className="mono">{formatPrice(leg.price)}</span>
                      </li>
                    ))}
                  </ul>
                  {strat && (
                    <Link className="text-link" to={`/strategies/${strat.id}`}>
                      Strategy: {strat.name} ?
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {!loading && !error && ops.length === 0 && (
        <div className="empty">
          Run a scan to surface live mispricings. Typical free-tier results show
          best-price edges more often than true arbs.
        </div>
      )}
    </section>
  );
}
