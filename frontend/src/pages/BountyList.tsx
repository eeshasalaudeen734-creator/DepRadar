import { Link } from "react-router-dom";
import { AddressLink, Empty, ErrorState, Loading, StatusBadge } from "../components/ui";
import { listBounties } from "../lib/contract";
import { formatAmount, relativeTime, tokenSymbol } from "../lib/format";
import type { Bounty } from "../lib/types";
import { useAsync } from "../lib/useAsync";

export function BountyList() {
  const state = useAsync(listBounties, "bounties");

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Bounties</h1>
          <p className="muted">Funded rewards for supply-chain security findings, held on-chain until a claim is verified.</p>
        </div>
        {state.status === "success" && <Stats bounties={state.data} />}
      </div>

      {state.status === "loading" && <Loading />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={state.reload} />}
      {state.status === "success" &&
        (state.data.length === 0 ? (
          <Empty>No bounties have been created on this contract yet.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Finding</th>
                  <th className="num">Reward</th>
                  <th>Status</th>
                  <th className="num">Claims</th>
                  <th>Deadline</th>
                  <th>Creator</th>
                </tr>
              </thead>
              <tbody>
                {state.data.map((b) => (
                  <tr key={b.id}>
                    <td className="mono muted">{b.id}</td>
                    <td>
                      <Link to={`/bounty/${b.id}`}>{b.issueRef}</Link>
                    </td>
                    <td className="num mono">
                      {formatAmount(b.amount)} {tokenSymbol(b.token)}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="num mono">{b.claimCount}</td>
                    <td className="muted">{b.status === "Open" ? relativeTime(b.deadline) : "—"}</td>
                    <td>
                      <AddressLink address={b.creator} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}

function Stats({ bounties }: { bounties: Bounty[] }) {
  const open = bounties.filter((b) => b.status === "Open").length;
  const released = bounties.filter((b) => b.status === "Released").length;
  return (
    <dl className="stats">
      <div>
        <dt>Total</dt>
        <dd>{bounties.length}</dd>
      </div>
      <div>
        <dt>Open</dt>
        <dd>{open}</dd>
      </div>
      <div>
        <dt>Paid out</dt>
        <dd>{released}</dd>
      </div>
    </dl>
  );
}
