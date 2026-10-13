import { describe, expect, it } from "vitest";
import { NATIVE_XLM_SAC } from "../config";
import { boardStats, bountyTimeline } from "./insights";
import type { Bounty, Claim } from "./types";

const base: Bounty = {
  id: 1,
  creator: "GCREATOR",
  issueRef: "npm:expresss",
  amount: 50_000_000n,
  token: NATIVE_XLM_SAC,
  status: "Open",
  createdAt: 1_000,
  deadline: 5_000,
  claimCount: 0,
  pendingClaims: 0,
};

const claim = (id: number, at: number, status: Claim["status"]): Claim => ({
  bountyId: 1,
  id,
  claimant: `G${id}`,
  proofRef: "pr",
  submittedAt: at,
  status,
});

describe("boardStats", () => {
  it("splits XLM between locked and paid and counts outcomes", () => {
    const stats = boardStats([
      { ...base, id: 1, status: "Open", claimCount: 1 },
      { ...base, id: 2, status: "Released", amount: 20_000_000n, claimCount: 2 },
      { ...base, id: 3, status: "Cancelled" },
    ]);
    expect(stats).toEqual({
      total: 3,
      open: 1,
      paid: 1,
      refunded: 1,
      lockedXlm: 50_000_000n,
      paidXlm: 20_000_000n,
      claims: 3,
    });
  });

  it("ignores non-XLM tokens in the XLM totals", () => {
    const stats = boardStats([{ ...base, token: "COTHER" }]);
    expect(stats.lockedXlm).toBe(0n);
    expect(stats.open).toBe(1);
  });
});

describe("bountyTimeline", () => {
  it("orders creation, claims and an upcoming deadline for an open bounty", () => {
    const events = bountyTimeline(base, [claim(1, 3_000, "Pending"), claim(0, 2_000, "Rejected")], 4_000);
    expect(events.map((e) => e.title)).toEqual([
      "Bounty funded",
      "Claim #0 submitted",
      "Claim #1 submitted",
      "Claims close",
    ]);
    expect(events.at(-1)?.upcoming).toBe(true);
  });

  it("ends a paid bounty with the winning claim", () => {
    const events = bountyTimeline(
      { ...base, status: "Released" },
      [claim(0, 2_000, "Rejected"), claim(1, 3_000, "Accepted")],
      4_000,
    );
    expect(events.at(-1)).toMatchObject({ kind: "paid", title: "Paid to claim #1" });
    expect(events.some((e) => e.kind === "deadline")).toBe(false);
  });

  it("shows the passed deadline before a refund", () => {
    const events = bountyTimeline({ ...base, status: "Cancelled" }, [], 9_000);
    expect(events.map((e) => e.kind)).toEqual(["created", "deadline", "refunded"]);
    expect(events[1].title).toBe("Claims closed");
  });
});
