# Testnet Read Client

Minimal read-only client for the `deprader_router` Soroban contract on
Stellar testnet. Fetches a single bounty and a single claim by ID via
`get_bounty` / `get_claim` and prints the result. No transactions are
submitted, no funded account is required — reads are simulated calls
against the RPC endpoint.

Contract ID: `CBFLUY6NB3JOQDEUOF2JG5TL3UD7GCQ7APUJ6EHNNSUJLUELHSGIG675`

## Usage

```bash
npm install
npm start                                    # defaults to bounty-id 1, claim-id 1
npm start -- --bounty-id 1 --claim-id 1
```

Bounty/claim ID `1` is real on-chain data — the pair used in the
`create_bounty` -> `submit_claim` -> `release` cycle recorded in
[PROGRESS.md](../PROGRESS.md). An ID with no matching bounty/claim prints
`(no bounty with this ID)` / `(no claim with this ID)` rather than erroring,
since `get_bounty`/`get_claim` return `None` for unknown IDs on-chain.
