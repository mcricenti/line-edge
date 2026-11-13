import { Link } from "react-router-dom";
import { edgeTypeLabel, strategies } from "../data/strategies";

export function StrategiesPage() {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Strategies</h1>
        <p>
          Drawn from your library: Sharper, Logic of Sports Betting, Fortune’s
          Formula, Trading Bases, Mathletics, Buchdahl, Thaler/Sauer/Dixon–Coles,
          and related research.
        </p>
      </header>
      <div className="strategy-list">
        {strategies.map((s) => (
          <Link key={s.id} to={`/strategies/${s.id}`} className="strategy-row">
            <div>
              <div className="strategy-title-row">
                <h2>{s.name}</h2>
                <span className={`pill ${s.liveDetectable ? "live" : "later"}`}>
                  {s.liveDetectable ? "Live scanner" : "Framework"}
                </span>
              </div>
              <p>{s.summary}</p>
            </div>
            <span className="edge-type">{edgeTypeLabel[s.edgeType]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
