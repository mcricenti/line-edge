import { Link, useParams } from "react-router-dom";
import { edgeTypeLabel, strategies } from "../data/strategies";

export function StrategyDetailPage() {
  const { id } = useParams();
  const s = strategies.find((x) => x.id === id);
  if (!s) {
    return (
      <section className="page">
        <p>Strategy not found.</p>
        <Link to="/strategies">Back</Link>
      </section>
    );
  }

  return (
    <section className="page narrow">
      <Link className="back" to="/strategies">
        ? All strategies
      </Link>
      <header className="page-head">
        <div className="strategy-title-row">
          <h1>{s.name}</h1>
          <span className={`pill ${s.liveDetectable ? "live" : "later"}`}>
            {s.liveDetectable ? "Live scanner" : "Framework"}
          </span>
        </div>
        <p>{s.summary}</p>
        <p className="muted">{edgeTypeLabel[s.edgeType]}</p>
      </header>

      <h2>How it works</h2>
      <ol className="steps">
        {s.howItWorks.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h2>Sources in your library</h2>
      <ul className="sources">
        {s.sources.map((src) => (
          <li key={src}>{src}</li>
        ))}
      </ul>

      <h2>Caveats</h2>
      <p className="caveat">{s.caveats}</p>

      {s.liveDetectable && (
        <Link className="btn primary" to="/scanner">
          Run scanner for this edge type
        </Link>
      )}
    </section>
  );
}
