/**
 * THE MAGIC MOMENT — an AI agent autonomously paying for a tool.
 *
 * This script is a minimal "agent" that:
 *   1. Browses the AgentExchange catalog (free)
 *   2. Hits the premium endpoint, receives HTTP 402 Payment Required
 *   3. Pays $0.005 USDC on Base Sepolia (testnet) from its own wallet
 *   4. Receives the data + a settlement receipt
 *
 * Run this, screen-record it, and you have launch-day content + a YC demo.
 *
 * Setup (see README): create an agent wallet, fund with testnet USDC from a faucet,
 * put its private key in .env as AGENT_PRIVATE_KEY (NEVER commit .env).
 */
require("dotenv").config();
const { privateKeyToAccount } = require("viem/accounts");
const { wrapFetchWithPayment } = require("x402-fetch");

const BASE_URL = process.env.MARKET_URL || "http://localhost:3000";

async function main() {
  console.log("🤖 agent booting…");

  // 1. Browse the market like any visitor
  const catalog = await (await fetch(`${BASE_URL}/api/tools?category=Payments`)).json();
  console.log(`🛒 browsed AgentExchange: ${catalog.count} payment tools listed`);

  // 2-4. Pay for the premium resource automatically on 402
  const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
  console.log(`👛 agent wallet: ${account.address}`);
  const fetchWithPay = wrapFetchWithPayment(fetch, account);

  console.log("💳 requesting premium signal (will auto-pay on HTTP 402)…");
  const res = await fetchWithPay(`${BASE_URL}/api/premium/signal`);
  const data = await res.json();

  console.log("✅ PAID & RECEIVED:");
  console.log(JSON.stringify(data, null, 2));
  const receipt = res.headers.get("x-payment-response");
  if (receipt) console.log("🧾 settlement receipt:", receipt);
  console.log("\n🎉 A machine just paid a machine. That's the company.");
}

main().catch(e => { console.error("💥", e.message); process.exit(1); });
