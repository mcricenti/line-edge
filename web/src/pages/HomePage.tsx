import { Link } from "react-router-dom";
import { strategies } from "../data/strategies";

export function HomePage() {
  const live = strategies.filter((s) => s.liveDetectable).length;

  return (
    <section className="hero">
      <p className="eyebrow">Sports wagering research desk</p>
      <h1 className="hero-brand">Line Edge</h1>
      <p className="hero-lead">
        Scan live sportsbook lines for arbitrage, soft-vs-sharp gaps, and best-price
        edges — then study the strategies behind durable betting edges.
      </p>
      <div className="cta-row">
        <Link className="btn primary" to="/scanner">
          Open live scanner
        </Link>
        <Link className="btn ghost" to="/strategies">
          Browse {strategies.length} strategies
        </Link>
      </div>
      <div className="hero-meta">
        <div>
          <strong>{live}</strong>
          <span>live-detectable now</span>
        </div>
        <div>
          <strong>{strategies.length - live}</strong>
          <span>model / process strategies</span>
        </div>
        <div>
          <strong>US + EU</strong>
          <span>books via The Odds API</span>
        </div>
      </div>
      <div className="hero-panel" aria-hidden="true">
        <div className="ticker">
          <span>ARB</span>
          <span>SHARP GAP</span>
          <span>LINE SHOP</span>
          <span>CLV</span>
          <span>KELLY</span>
          <span>DIXON–COLES</span>
        </div>
      </div>
    </section>
  );
}
