import { Link, useParams } from "react-router-dom";
import { AddressLink, Empty, ErrorState, Loading, StatusBadge } from "../components/ui";
import { getBounty, listClaims } from "../lib/contract";
import { formatAmount, formatDate, relativeTime, tokenSymbol } from "../lib/format";
import { useAsync } from "../lib/useAsync";

export function BountyDetail() {
  const idParam = useParams().id;
  const id = Number(idParam);
  const state = useAsync(async () => {
    if (!Number.isInteger(id) || id < 1) return null;
    const bounty = await getBounty(id);
    return bounty && { bounty, claims: await listClaims(bounty) };
  }, `bounty:${idParam}`);

  return (
    <section>
      <Link to="/" className="back">
        ← All bounties
      </Link>

      {state.status === "loading" && <Loading />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={state.reload} />}
      {state.status === "success" && state.data === null && <Empty>Bounty #{idParam} doesn't exist.</Empty>}
      {state.status === "success" && state.data && (
        <>
          <div className="page-head">
            <div>
              <p className="muted mono">Bounty #{state.data.bounty.id}</p>
              <h1>{state.data.bounty.issueRef}</h1>
            </div>
            <StatusBadge status={state.data.bounty.status} />
          </div>

          <dl className="facts">
            <div>
              <dt>Reward</dt>
              <dd className="mono">
                {formatAmount(state.data.bounty.amount)} {tokenSymbol(state.data.bounty.token)}
              </dd>
            </div>
            <div>
              <dt>Creator</dt>
              <dd>
                <AddressLink address={state.data.bounty.creator} />
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(state.data.bounty.createdAt)}</dd>
            </div>
            <div>
              <dt>Claims close</dt>
              <dd>
                {formatDate(state.data.bounty.deadline)}{" "}
                {state.data.bounty.status === "Open" && (
                  <span className="muted">({relativeTime(state.data.bounty.deadline)})</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Pending review</dt>
              <dd>{state.data.bounty.pendingClaims}</dd>
            </div>
          </dl>

          <h2>Claims ({state.data.claims.length})</h2>
          {state.data.claims.length === 0 ? (
            <Empty>No one has claimed this bounty yet.</Empty>
          ) : (
            <ol className="claims">
              {state.data.claims.map((c) => (
                <li key={c.id} className={`claim claim-${c.status.toLowerCase()}`}>
                  <div className="claim-head">
                    <span className="mono muted">Claim #{c.id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="proof">{c.proofRef}</p>
                  <p className="muted">
                    <AddressLink address={c.claimant} /> · {formatDate(c.submittedAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}
