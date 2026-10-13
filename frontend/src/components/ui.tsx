import type { ReactNode } from "react";
import { explorer } from "../config";
import { shortAddress } from "../lib/format";
import type { BountyStatus, ClaimStatus } from "../lib/types";

export function StatusBadge({ status }: { status: BountyStatus | ClaimStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

export function AddressLink({ address }: { address: string }) {
  const href = address.startsWith("C") ? explorer.contract(address) : explorer.account(address);
  return (
    <a className="mono" href={href} target="_blank" rel="noreferrer" title={address}>
      {shortAddress(address)}
    </a>
  );
}

export function Loading({ label = "Loading from testnet…" }: { label?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden /> {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <strong>Couldn't read the contract.</strong>
      <span className="muted">{error.message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state muted">{children}</div>;
}
