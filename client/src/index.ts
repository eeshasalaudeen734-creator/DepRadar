/**
 * Minimal read-only client for the deprader_router Soroban contract on
 * Stellar testnet. Fetches a single bounty and a single claim by ID and
 * prints the result — no submitted transactions, no UI.
 *
 * Usage:
 *   npm start -- --bounty-id 1 --claim-id 1
 *
 * Both flags default to 1, the bounty_id used in the on-chain
 * create_bounty -> submit_claim -> release cycle described in
 * PROGRESS.md, so running with no flags exercises real data.
 */
import { rpc } from "@stellar/stellar-sdk";

const CONTRACT_ID = "CBFLUY6NB3JOQDEUOF2JG5TL3UD7GCQ7APUJ6EHNNSUJLUELHSGIG675";
const RPC_URL = "https://soroban-testnet.stellar.org";

function parseArgs(argv: string[]): { bountyId: number; claimId: number } {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      flags.set(arg.slice(2), argv[i + 1]);
      i += 1;
    }
  }

  const bountyId = Number(flags.get("bounty-id") ?? "1");
  const claimId = Number(flags.get("claim-id") ?? "1");

  if (!Number.isInteger(bountyId) || bountyId < 0) {
    throw new Error(`--bounty-id must be a non-negative integer, got: ${flags.get("bounty-id")}`);
  }
  if (!Number.isInteger(claimId) || claimId < 0) {
    throw new Error(`--claim-id must be a non-negative integer, got: ${flags.get("claim-id")}`);
  }

  return { bountyId, claimId };
}

async function main() {
  const { bountyId, claimId } = parseArgs(process.argv.slice(2));
  const server = new rpc.Server(RPC_URL);

  const health = await server.getHealth();
  console.log(`Connected to ${RPC_URL} (status: ${health.status}, latest ledger: ${health.latestLedger})`);
  console.log(`Contract: ${CONTRACT_ID}\n`);

  const { result: bounty } = await server.queryContract(CONTRACT_ID, "get_bounty", { bounty_id: bountyId });
  console.log(`get_bounty(${bountyId}) =>`);
  console.log(bounty === null ? "  (no bounty with this ID)" : JSON.stringify(bounty, bigIntReplacer, 2));

  const { result: claim } = await server.queryContract(CONTRACT_ID, "get_claim", { bounty_id: claimId });
  console.log(`\nget_claim(${claimId}) =>`);
  console.log(claim === null ? "  (no claim with this ID)" : JSON.stringify(claim, bigIntReplacer, 2));
}

function bigIntReplacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

main().catch((err) => {
  console.error("Read failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
