const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const TOOLS_FILE = path.join(__dirname, "tools.json");
const SUBS_FILE = path.join(__dirname, "submissions.json");

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

app.post("/api/submit", (req, res) => {
  const { name, description, link, pricing, contact } = req.body || {};
  if (!name || !link || !contact) {
    return res.status(400).json({ error: "Required: name, link, contact. Optional: description, pricing." });
  }
  const subs = fs.existsSync(SUBS_FILE) ? JSON.parse(fs.readFileSync(SUBS_FILE, "utf8")) : [];
  subs.push({ name, description: description || "", link, pricing: pricing || "unknown",
              contact, ts: new Date().toISOString(), status: "pending_review" });
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
  res.json({ ok: true, message: "Submitted! You'll hear from the founders.", position: subs.length });
});

app.get("/api/submissions", (req, res) => {
  if (req.query.token !== (process.env.ADMIN_TOKEN || "changeme")) return res.status(401).json({ error: "unauthorized" });
  const subs = fs.existsSync(SUBS_FILE) ? JSON.parse(fs.readFileSync(SUBS_FILE, "utf8")) : [];
  res.json({ count: subs.length, submissions: subs });
});

const X402_ENABLED = process.env.X402_ENABLED === "true";
if (X402_ENABLED) {
  const { paymentMiddleware } = require("x402-express");
  app.use(paymentMiddleware(
    process.env.PAY_TO,
    { "GET /api/premium/signal": { price: "$0.005", network: process.env.X402_NETWORK || "base-sepolia" } }
  ));
}

app.get("/api/premium/signal", (req, res) => {
  res.json({
    product: "AgentExchange Premium Signal (demo)",
    signal: {
      timestamp: new Date().toISOString(),
      toolsIndexed: JSON.parse(fs.readFileSync(TOOLS_FILE, "utf8")).length,
      hottestCategory: "Payments",
      note: "A machine just paid a machine. Welcome to the settlement layer."
    },
    paid: X402_ENABLED
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AgentExchange live on port ${PORT}`));

