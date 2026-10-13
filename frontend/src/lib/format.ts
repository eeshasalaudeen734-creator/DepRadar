import { NATIVE_XLM_SAC } from "../config";

/** Stellar assets use 7 decimal places. */
const DECIMALS = 7n;
const SCALE = 10n ** DECIMALS;

/** Formats a raw token amount (e.g. 50000000n stroops) as "5" or "5.25". */
export function formatAmount(raw: bigint): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const whole = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(Number(DECIMALS), "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole.toLocaleString("en-US")}${frac ? `.${frac}` : ""}`;
}

export function tokenSymbol(token: string): string {
  return token === NATIVE_XLM_SAC ? "XLM" : shortAddress(token);
}

/** "GCFFP6…4D6A" */
export function shortAddress(address: string, keep = 6): string {
  return address.length <= keep * 2 + 1 ? address : `${address.slice(0, keep)}…${address.slice(-4)}`;
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "in 12 days" / "3 hours ago", relative to `now` (unix seconds). */
export function relativeTime(unixSeconds: number, now = Date.now() / 1000): string {
  const diff = unixSeconds - now;
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secs] of units) {
    if (abs >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(Math.round(diff), "second");
}

/** Splits `npm:expresss typosquat of express` into ecosystem and description. */
export function splitIssueRef(ref: string): { ecosystem: string | null; text: string } {
  const m = /^([a-z0-9.-]{2,12}):\s*(.+)$/i.exec(ref);
  return m ? { ecosystem: m[1].toLowerCase(), text: m[2] } : { ecosystem: null, text: ref };
}
