# AgentExchange

**The trusted directory where AI agents discover, evaluate, and pay for tools.**

> Whoever controls the discovery/trust layer of agent commerce holds power comparable to Google's over the web.

## What's in this repo (full product v1)

| Piece | Path | What it does |
|---|---|---|
| Directory site | `public/index.html` | Searchable, categorized catalog of agent-usable tools with pricing + verification badges |
| Catalog API | `GET /api/tools` | Machine-readable catalog — **agents can browse our market programmatically** |
| Submissions API | `POST /api/submit` | Tool builders list themselves; stored to `data/submissions.json`; review queue at `/api/submissions?token=...` |
| **Payment layer (x402)** | `GET /api/premium/signal` | Demo paid endpoint: returns HTTP 402 until the calling agent pays $0.005 USDC — proof we can wrap ANY api with pay-per-call |
| Paying agent | `agent/pay-demo.js` | A minimal agent that browses the market, hits the paywall, pays autonomously, gets the data + receipt |

## Quickstart (no wallet needed)

```bash
npm install
npm start          # → http://localhost:3000  (site + free APIs work immediately)
```

## Turn on real machine payments (testnet, ~30 min)

1. Create two wallets (e.g. in Coinbase Wallet or any EVM wallet): one **receiving** (yours) and one **agent** wallet.
2. Fund the agent wallet with Base Sepolia testnet USDC + a little test ETH (Circle faucet: faucet.circle.com; Base faucet for gas).
3. `cp .env.example .env` and fill: `X402_ENABLED=true`, `PAY_TO=<your receiving address>`, `AGENT_PRIVATE_KEY=<agent wallet key>`.
4. **Verify current package versions** — x402 libs move fast; check the official Coinbase x402 docs / npm for the latest `x402-express` and `x402-fetch` and their exact middleware signatures. Adjust `server/index.js` if the API changed.
5. Run the magic moment:

```bash
npm start          # terminal 1
npm run agent      # terminal 2 → watch a machine pay a machine 🎉
```

Screen-record that terminal. That's launch content, YC demo, and O-1 evidence in one.

## Deploy

- **Site + API:** Railway / Render / Fly.io (free tiers run Node + persistent volume for `data/`). Vercel works for the static site but the API needs a server — Railway is simplest for both.
- **Domain:** point your custom domain at the deployment. Update social links in `public/index.html` (search `YOUR_HANDLE`, `YOUR_GITHUB`, `YOUR_EMAIL`).
- Set a real `ADMIN_TOKEN` in production env vars.

## Roadmap (the ladder)

1. **Now:** curated directory + submissions + one paid demo endpoint
2. **Next:** "wrap my API" self-serve — any listed dev gets their own x402 paywall + our take-rate
3. **Then:** reliability scores from our test agent auto-auditing every listing
4. **Later:** revenue dashboards → financing against verified revenue → the exchange

## Honest engineering notes

- Catalog links currently point mostly at PulseMCP profile pages — replace with each tool's exact URL as you verify them.
- `data/*.json` is a flat-file database — perfect for v1, swap to SQLite/Postgres when submissions grow.
- The x402 integration is written against Coinbase's documented middleware pattern but **was not run against live testnet from inside this environment** — expect up to an hour of version-alignment when you first run it. That hour is your bootcamp.
