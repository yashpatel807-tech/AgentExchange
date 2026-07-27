const db = require('./init');

const tools = [
  {"name":"Investment Research MCP","description":"16 finance tools: SEC filings, insider trades, FINRA short interest, live quotes.","category":"Finance","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Walnut Portfolio Analysis","description":"Portfolio allocation, risk and performance analysis for Claude/ChatGPT.","category":"Finance","pricing":"freemium","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Twelve Data / Yahoo Finance Workers","description":"Remote market-data MCP servers on Cloudflare Workers.","category":"Finance","pricing":"freemium","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Visuary Actuarial Calc","description":"Actuarial value from any health-plan document.","category":"Finance","pricing":"paid","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Crest x402 Payee Verification","description":"Verifies who your agent is about to pay: service, relayer, treasury, or buyer.","category":"Payments","pricing":"free","protocols":"[\"x402\",\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"HTTP 402 Challenge Inspector","description":"Analyzes x402 payment challenges — debugging for machine payments.","category":"Payments","pricing":"free","protocols":"[\"x402\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Tokenizin Web to Markdown","description":"Any URL to clean agent-readable Markdown. ~7.5k weekly users.","category":"Web & Data","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"cotdp Web Extraction","description":"Scraping and structured extraction toolset.","category":"Web & Data","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"PubFi Crypto Data Gateway","description":"Routed on-chain and market crypto data for agents.","category":"Web & Data","pricing":"paid","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Apify Actors Marketplace","description":"Thousands of scrapers/automations agents run pay-per-event.","category":"Web & Data","pricing":"paid","protocols":"[\"MCP\",\"API\"]","link":"https://apify.com","verified":1},
  {"name":"BYTEROVER Memory","description":"Persistent memory across agent sessions.","category":"Agent Infra","pricing":"freemium","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Push Realm Knowledge Base","description":"Agents search, submit and vote on solutions collaboratively.","category":"Agent Infra","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Browser Use","description":"Full browser control for agents on any site.","category":"Agent Infra","pricing":"freemium","protocols":"[\"MCP\",\"API\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"SVG Render Kit","description":"Structured JSON to rendered SVG for agent content.","category":"Dev Tools","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"CI Failure Triage","description":"Analyzes CI build failures and searches logs.","category":"Dev Tools","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"S3 Snippet Manager","description":"Store, tag, retrieve code snippets in your own S3.","category":"Dev Tools","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Publora Social Publishing","description":"Publish to 10 social platforms from one integration.","category":"Marketing","pricing":"paid","protocols":"[\"MCP\",\"API\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"AdButler Campaign Tools","description":"Full ad-platform management over MCP.","category":"Marketing","pricing":"paid","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Nutrition Image Analysis","description":"Food photo to nutritional breakdown. 17k+ uses.","category":"Consumer","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Wellness Project Coach","description":"Fitness, nutrition, sleep coaching with Claude/ChatGPT integration.","category":"Consumer","pricing":"freemium","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1},
  {"name":"Specialty Espresso Finder","description":"Curated specialty cafes with quality scoring.","category":"Consumer","pricing":"free","protocols":"[\"MCP\"]","link":"https://www.pulsemcp.com","verified":1}
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO tools (name, description, category, pricing, protocols, link, verified)
  VALUES (@name, @description, @category, @pricing, @protocols, @link, @verified)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) insert.run(item);
});

insertMany(tools);
console.log(`Seeded ${tools.length} tools into database.`);

// Seed some initial grades for demo
const gradeStmt = db.prepare(`
  INSERT OR IGNORE INTO grades (tool_id, overall_score, reliability_score, latency_score, accuracy_score, security_score, docs_score, agent_compat_score, economic_score, test_count, last_tested_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

// Generate realistic grades for each tool
const gradeData = [
  [1, 87, 92, 78, 85, 88, 90, 82, 95, 12],
  [2, 91, 95, 88, 90, 92, 85, 89, 85, 15],
  [3, 76, 80, 72, 78, 75, 70, 80, 90, 8],
  [4, 83, 85, 80, 88, 82, 75, 85, 70, 10],
  [5, 94, 98, 92, 95, 96, 90, 93, 88, 20],
  [6, 89, 90, 85, 92, 88, 85, 87, 95, 14],
  [7, 72, 75, 68, 70, 72, 65, 78, 98, 6],
  [8, 85, 88, 82, 80, 85, 78, 83, 92, 11],
  [9, 78, 80, 75, 82, 78, 72, 80, 75, 9],
  [10, 93, 95, 90, 92, 94, 88, 91, 80, 18],
  [11, 88, 90, 85, 87, 86, 82, 88, 85, 13],
  [12, 75, 78, 72, 74, 76, 70, 80, 95, 7],
  [13, 90, 92, 88, 89, 90, 85, 91, 78, 16],
  [14, 82, 85, 78, 80, 82, 75, 85, 98, 10],
  [15, 86, 88, 82, 85, 87, 80, 84, 92, 12],
  [16, 79, 82, 75, 78, 80, 72, 81, 95, 8],
  [17, 88, 90, 85, 87, 88, 82, 86, 70, 14],
  [18, 84, 86, 80, 85, 84, 78, 83, 72, 11],
  [19, 91, 93, 88, 92, 90, 85, 89, 98, 17],
  [20, 80, 82, 76, 79, 81, 74, 82, 88, 9],
  [21, 77, 80, 72, 75, 78, 70, 79, 95, 7]
];

for (const g of gradeData) {
  gradeStmt.run(...g);
}

console.log(`Seeded ${gradeData.length} grades.`);
console.log('Database seed complete.');
