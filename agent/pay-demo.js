require('dotenv').config();
const { privateKeyToAccount } = require('viem/accounts');
const { wrapFetchWithPayment } = require('x402-fetch');

const BASE_URL = process.env.BASE_URL || 'https://toolexchange.ai';

async function main() {
  console.log("Agent booting...");
  console.log("Connecting to " + BASE_URL);

  const catalogRes = await fetch(BASE_URL + '/api/tools?category=Payments');
  const catalog = await catalogRes.json();
  console.log("Browsed toolexchange.ai: " + catalog.count + " tools, " + catalog.stats.gradedTools + " graded");

  const leaderboardRes = await fetch(BASE_URL + '/api/leaderboard?limit=5');
  const leaderboard = await leaderboardRes.json();
  console.log("Top tool: " + (leaderboard.leaderboard[0] && leaderboard.leaderboard[0].name) + " (" + (leaderboard.leaderboard[0] && leaderboard.leaderboard[0].overall_score) + "/100)");

  if (process.env.AGENT_PRIVATE_KEY) {
    const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
    console.log("Agent wallet: " + account.address);
    const fetchWithPay = wrapFetchWithPayment(fetch, account);

    console.log("Requesting premium signal (auto-pay on HTTP 402)...");
    const res = await fetchWithPay(BASE_URL + '/api/premium/signal');
    const data = await res.json();
    console.log("PAID & RECEIVED:");
    console.log(JSON.stringify(data, null, 2));
    const receipt = res.headers.get("x-payment-response");
    if (receipt) console.log("Settlement receipt:", receipt);
    console.log("
A machine just paid a machine. That's toolexchange.ai.");
  } else {
    console.log("No AGENT_PRIVATE_KEY set. Set it to test live payments.");
  }
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
