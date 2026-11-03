# Balance Lab

A self-contained wallet threshold-checking prototype. Open `index.html` in the workspace preview for demo mode. For browser-wallet access, serve index.html, style.css and app.js together from localhost or a trusted HTTPS origin in a browser with an Ethereum-compatible extension. Embedded previews may not expose wallet providers.

## What works

- Four clearly labeled sample wallets; arbitrary positive native-ETH thresholds.
- Read-only connection to an injected EIP-1193 provider (`window.ethereum`).
- Ethereum mainnet and Sepolia balances queried with `eth_getBalance` at a specific canonical block hash using EIP-1898.
- Exact 18-decimal integer comparisons with BigInt; no floating-point balance comparison.
- Threshold pass/fail results, optional local reveal, copy/export JSON.
- Export omits wallet address, exact balance and history. A threshold and its result still reveal a balance bound.
- Inputs and wallet/network events invalidate previous results; async results for old inputs are discarded.
- No wallet signatures, transactions, token approvals, private keys, history queries, analytics, external JavaScript, or persistent account storage.

## This is NOT a proof system

The exported summary is unsigned, editable and not independently verifiable. It is not a zkTLS proof, a zero-knowledge proof, a storage proof, an ownership proof, or a Primus integration. Never use it to gate rewards, access, lending or financial decisions. Live data is trusted to the connected wallet/RPC provider. The RPC provider sees the queried address; the page sees the address and balance. Omitting an address from export does not make a public blockchain private. The latest block may not be finalized and can be reorganized. Sepolia ETH is test currency.

The user-facing privacy goal requires a separate production cryptographic design: authenticated state or supported attested data source, a private balance comparison, wallet-control binding, verifier challenge/domain binding, freshness and replay defenses, a verifier independent of the client, and security review. Neither a hidden UI field nor an account signature alone proves a private balance. Do not relabel this prototype as a cryptographic proof application.

## Checks to perform in a browser

1. Demo: 2.5 ETH against 1 ETH passes; 0.08 against 1 fails; 1 against 1 passes; zero against 1 fails.
2. Threshold 2.500000000000000001 against sample 2.5 fails; 2.5 passes.
3. Zero, negatives, exponents, commas, more than 18 decimals and empty values are rejected.
4. Editing a threshold or changing modes invalidates results and disables exports.
5. Switching account/network invalidates results. Rejecting wallet permission shows an error.
6. A missing injected wallet shows instructions rather than a fabricated result.
7. Reveal/hide never changes exported fields. Demo exports are explicitly labeled simulated.
8. Clipboard failures suggest downloading JSON instead.
9. Mainnet/Sepolia live checks need real browser-wallet testing. Unsupported networks and RPC methods must fail visibly; there is no downgrade to an ambiguous block query.

Live wallet integration has not been tested in this workspace; no wallet credentials are needed or requested here.

## Technical references

- https://eips.ethereum.org/EIPS/eip-1193
- https://eips.ethereum.org/EIPS/eip-1898

Existing Commonroom files remain in `commonroom/`.
