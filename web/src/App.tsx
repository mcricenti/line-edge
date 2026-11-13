import { Link, NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ScannerPage } from "./pages/ScannerPage";
import { StrategiesPage } from "./pages/StrategiesPage";
import { StrategyDetailPage } from "./pages/StrategyDetailPage";

export function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Line Edge
        </Link>
        <nav className="nav">
          <NavLink to="/scanner">Scanner</NavLink>
          <NavLink to="/strategies">Strategies</NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/strategies" element={<StrategiesPage />} />
          <Route path="/strategies/:id" element={<StrategyDetailPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>
          Research-backed mispricing scanner. Not financial advice. Bet only where
          legal. Odds via{" "}
          <a href="https://the-odds-api.com/" target="_blank" rel="noreferrer">
            The Odds API
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
