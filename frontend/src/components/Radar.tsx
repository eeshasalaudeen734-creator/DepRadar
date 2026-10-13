import { Link } from "react-router-dom";
import { BOUNTY_LABEL } from "../lib/insights";
import type { Bounty } from "../lib/types";

const SIZE = 320;
const C = SIZE / 2;

/** Deterministic position for a bounty's blip (golden-angle spiral). */
function blipPosition(id: number): { x: number; y: number } {
  const angle = ((id * 137.508) % 360) * (Math.PI / 180);
  const r = 46 + ((id * 53) % 96);
  return { x: C + r * Math.cos(angle), y: C + r * Math.sin(angle) };
}

/** Animated radar; each blip is a real bounty and links to it. */
export function Radar({ bounties }: { bounties: Bounty[] }) {
  return (
    <div className="radar-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar-svg" role="img" aria-label={`Radar showing ${bounties.length} bounties`}>
        <defs>
          <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f2a2c" />
            <stop offset="100%" stopColor="#081018" />
          </radialGradient>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <circle cx={C} cy={C} r={C - 2} fill="url(#radar-bg)" stroke="#1e3a3f" strokeWidth="1.5" />
        {[0.25, 0.5, 0.75].map((f) => (
          <circle key={f} cx={C} cy={C} r={(C - 2) * f} fill="none" stroke="#1e3a3f" strokeWidth="1" />
        ))}
        <line x1={C} y1={4} x2={C} y2={SIZE - 4} stroke="#16302f" />
        <line x1={4} y1={C} x2={SIZE - 4} y2={C} stroke="#16302f" />

        <g className="radar-sweep">
          <path d={`M${C},${C} L${SIZE - 2},${C} A${C - 2},${C - 2} 0 0,0 ${C + (C - 2) * Math.cos(-Math.PI / 4)},${C + (C - 2) * Math.sin(-Math.PI / 4)} Z`} fill="url(#sweep)" />
          <line x1={C} y1={C} x2={SIZE - 2} y2={C} stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.9" />
        </g>

        {bounties.map((b) => {
          const { x, y } = blipPosition(b.id);
          return (
            <Link key={b.id} to={`/bounty/${b.id}`} aria-label={`Bounty #${b.id}: ${b.issueRef} (${BOUNTY_LABEL[b.status]})`}>
              <g className={`blip blip-${b.status.toLowerCase()}`} style={{ animationDelay: `${(b.id % 5) * 0.6}s` }}>
                <circle cx={x} cy={y} r="14" className="blip-halo" />
                <circle cx={x} cy={y} r="5" className="blip-core" />
              </g>
            </Link>
          );
        })}
        <circle cx={C} cy={C} r="3" fill="#2dd4bf" />
      </svg>
    </div>
  );
}
