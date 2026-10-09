---
name: Scanner module
about: Propose or track a new dependency/vulnerability scanner module
title: "[scanner] "
labels: scanner-module
---

## Registry / detection type

Which package registry or detection type does this scanner target?
(e.g. npm, PyPI, crates.io, Go modules, RubyGems, CVE pattern matching,
license detection, typosquat detection, etc.)

## Expected input / output format

- **Input:** what does this module consume (manifest file, lockfile, SBOM,
  raw source tree, registry API response)?
- **Output:** what does it emit, and in what shape (JSON schema, list of
  findings, severity levels, field names)?

## Interface with deprader_router

How does this module interface with the `deprader_router` contract
(testnet contract ID: `CCPRQANY467KKE4ROKCNW6TH3LY3EPVFRXIXJ5V4VCYHLJKWZPOZYQJQ`)?

For example: does it call `create_bounty` for findings it surfaces, submit
claims via `submit_claim`, or only read bounty/claim state via `get_bounty` /
`get_claim`? Note any bounty_id or issue_ref conventions it relies on.

## Definition of Done

- [ ] Module implemented and tested
- [ ] Added an entry to PROGRESS.md describing what was built, by whom, and
      which issue it closes.
