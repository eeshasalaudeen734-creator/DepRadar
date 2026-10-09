---
name: Crawler module
about: Propose or track a new registry crawler module
title: "[crawler] "
labels: crawler-module
---

## Registry / detection type

Which package registry does this crawler target, and what is it detecting
as it crawls? (e.g. new package publishes on npm, new releases on crates.io,
metadata changes on PyPI, dependency graph updates, etc.)

## Expected input / output format

- **Input:** what does this module consume (registry API endpoint, feed
  URL, polling cadence, prior crawl checkpoint/cursor)?
- **Output:** what does it emit, and in what shape (JSON schema, list of
  discovered packages/versions, event format for downstream consumers)?

## Interface with deprader_router

How does this module interface with the `deprader_router` contract
(testnet contract ID: `CCPRQANY467KKE4ROKCNW6TH3LY3EPVFRXIXJ5V4VCYHLJKWZPOZYQJQ`)?

For example: does it hand off discovered items to a scanner module that
calls `create_bounty`, does it read existing bounty/claim state via
`get_bounty` / `get_claim` to avoid duplicate work, or does it not touch
the contract directly at all?

## Definition of Done

- [ ] Module implemented and tested
- [ ] Added an entry to PROGRESS.md describing what was built, by whom, and
      which issue it closes.
