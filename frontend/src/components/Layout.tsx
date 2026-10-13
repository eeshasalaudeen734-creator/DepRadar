import { Link, Outlet } from "react-router-dom";
import { CONTRACT_ID, NETWORK, explorer } from "../config";
import { shortAddress } from "../lib/format";

export function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="radar" aria-hidden />
          DepRadar
        </Link>
        <nav className="topbar-meta">
          <span className="pill">{NETWORK}</span>
          <a href={explorer.contract(CONTRACT_ID)} target="_blank" rel="noreferrer" className="mono">
            {shortAddress(CONTRACT_ID)}
          </a>
          <a href="https://github.com/DepRadarOrg/DepRadar" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer muted">
        Read-only view of the <code>deprader_router</code> contract. Nothing here signs or submits transactions.
      </footer>
    </div>
  );
}
