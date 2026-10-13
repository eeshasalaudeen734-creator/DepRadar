import { describe, expect, it } from "vitest";
import { parseBounty, parseClaim } from "./contract";

// Shapes as returned by `queryContract` against the live v2 router.
const rawBounty = {
  amount: 50_000_000n,
  claim_count: 2,
  created_at: 1_791_546_147n,
  creator: "GCFFP6RU6C3JOZBIUNZN2ELJAITUZ3HWEOUUCFXIAHE6M2GHVHZB4D6A",
  deadline: 1_794_138_138n,
  issue_ref: "npm:expresss typosquat of express (demo)",
  pending_claims: 0,
  status: { tag: "Released" },
  token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
};

describe("parseBounty", () => {
  it("maps contract fields to the Bounty type", () => {
    expect(parseBounty(1, rawBounty)).toEqual({
      id: 1,
      creator: rawBounty.creator,
      issueRef: rawBounty.issue_ref,
      amount: 50_000_000n,
      token: rawBounty.token,
      status: "Released",
      createdAt: 1_791_546_147,
      deadline: 1_794_138_138,
      claimCount: 2,
      pendingClaims: 0,
    });
  });

  it("accepts enums decoded as plain strings", () => {
    expect(parseBounty(1, { ...rawBounty, status: "Open" }).status).toBe("Open");
  });

  it("rejects an unrecognised enum shape", () => {
    expect(() => parseBounty(1, { ...rawBounty, status: 3 })).toThrow(/Unexpected enum/);
  });
});

describe("parseClaim", () => {
  it("maps contract fields to the Claim type", () => {
    const claim = parseClaim(1, 0, {
      claimant: "GC2OYUR53G6IHMRXS2IH2WV3ANIXHIKXM3OJRXSDKESMLEYEOXQN4BLY",
      proof_ref: "junk",
      status: { tag: "Rejected" },
      submitted_at: 1_791_546_157n,
    });
    expect(claim).toEqual({
      bountyId: 1,
      id: 0,
      claimant: "GC2OYUR53G6IHMRXS2IH2WV3ANIXHIKXM3OJRXSDKESMLEYEOXQN4BLY",
      proofRef: "junk",
      submittedAt: 1_791_546_157,
      status: "Rejected",
    });
  });
});
