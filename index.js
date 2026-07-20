/**
 * AgentExchange — full product v1 backend
 * - Serves the directory site (public/)
 * - GET  /api/tools            → the catalog (agents + humans can read it)
 * - POST /api/submit           → tool submissions (stored to data/submissions.json)
 * - GET  /api/premium/signal   → DEMO PAID ENDPOINT protected by x402 (agents pay USDC per call)
 *
 * The premium endpoint is our proof-of-concept that this marketplace can wrap
 * any API with pay-per-call. Toggle X402_ENABLED=true once you have a wallet.
 */
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const DATA = path.join(__dirname, "..", "data");
const TOOLS_FILE = path.join(DATA, "tools.json");
const SUBS_FILE = path.join(DATA, "submissions.json");

// ---------- catalog API (machine-readable — agents can browse us!) ----------
app.get("/api/tools", (req, res) => {
  const tools = JSON.parse(fs.readFileSync(TOOLS_FILE, "utf8"));
  const { category, q } = req.query;
  let out = tools;
  if (category) out = out.filter(t => t.category.toLowerCase() === String(category).toLowerCase());
  if (q) {
    const s = String(q).toLowerCase();
    out = out.filter(t => (t.name + " " + t.description + " " + t.category).toLowerCase().includes(s));
  }
  res.json({ count: out.length, tools: out, market: "AgentExchange v1", listYourTool: "/api/submit (POST)" });
});

// ---------- submissions (the growth engine) ----------
app.post("/api/submit", (req, res) => {
  const { name, description, link, pricing, contact } = req.body || {};
  if (!name || !link || !contact) {
    return res.status(400).json({ error: "Required: name, link, contact. Optional: description, pricing." });
  }
  const subs = fs.existsSync(SUBS_FILE) ? JSON.parse(fs.readFileSync(SUBS_FILE, "utf8")) : [];
  subs.push({ name, description: description || "", link, pricing: pricing || "unknown",
              contact, ts: new Date().toISOString(), status: "pending_review" });
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
  res.json({ ok: true, message: "Submitted! We hand-verify every tool. You'll hear from the founders.", position: subs.length });
});

// founders-only: review queue (protect with token in env)
app.get("/api/submissions", (req, res) => {
  if (req.query.token !== (process.env.ADMIN_TOKEN || "changeme")) return res.status(401).json({ error: "unauthorized" });
  const subs = fs.existsSync(SUBS_FILE) ? JSON.parse(fs.readFileSync(SUBS_FILE, "utf8")) : [];
  res.json({ count: subs.length, submissions: subs });
});

// ---------- THE PAYMENT LAYER (x402 demo endpoint) ----------
// When X402_ENABLED=true and you've set PAY_TO (your wallet address),
// this endpoint returns HTTP 402 until the calling agent pays $0.005 USDC on Base.
// Uses Coinbase's x402-express middleware. See README for setup + latest package versions.
const X402_ENABLED = process.env.X402_ENABLED === "true";
if (X402_ENABLED) {
  const { paymentMiddleware } = require("x402-express");
  app.use(paymentMiddleware(
    process.env.PAY_TO, // your receiving wallet (0x...)
    { "GET /api/premium/signal": { price: "$0.005", network: process.env.X402_NETWORK || "base-sepolia" } }
  ));
  console.log("x402 payment layer: ENABLED (network:", process.env.X402_NETWORK || "base-sepolia", ")");
} else {
  console.log("x402 payment layer: disabled (set X402_ENABLED=true after wallet setup)");
}

// The paid resource itself: a tiny "market signal" only paying agents receive.
// This is a stand-in for ANY api we (or a listed dev) want to monetize.
app.get("/api/premium/signal", (req, res) => {
  res.json({
    product: "AgentExchange Premium Signal (demo)",
    signal: {
      timestamp: new Date().toISOString(),
      toolsIndexed: JSON.parse(fs.readFileSync(TOOLS_FILE, "utf8")).length,
      hottestCategory: "Payments",
      note: "You just witnessed a machine pay a machine. Welcome to the settlement layer."
    },
    paid: X402_ENABLED
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AgentExchange live → http://localhost:${PORT}`));
