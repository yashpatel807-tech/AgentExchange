const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(DB_DIR, 'toolexchange.db');

// Create directory if it doesn't exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    pricing TEXT DEFAULT 'unknown',
    protocols TEXT,
    link TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    pricing TEXT DEFAULT 'unknown',
    contact TEXT NOT NULL,
    category TEXT,
    protocols TEXT,
    status TEXT DEFAULT 'pending_review',
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL,
    overall_score REAL,
    reliability_score REAL,
    latency_score REAL,
    accuracy_score REAL,
    security_score REAL,
    docs_score REAL,
    agent_compat_score REAL,
    economic_score REAL,
    test_results TEXT,
    raw_latency_ms INTEGER,
    success_rate REAL,
    last_tested_at DATETIME,
    test_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id)
  );

  CREATE TABLE IF NOT EXISTS grade_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL,
    overall_score REAL,
    reliability_score REAL,
    latency_score REAL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER,
    payer_address TEXT,
    amount_usd TEXT,
    amount_wei TEXT,
    tx_hash TEXT,
    network TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id)
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    name TEXT,
    tier TEXT DEFAULT 'free',
    rate_limit INTEGER DEFAULT 100,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
  CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools(featured);
  CREATE INDEX IF NOT EXISTS idx_grades_tool_id ON grades(tool_id);
  CREATE INDEX IF NOT EXISTS idx_grades_overall ON grades(overall_score);
  CREATE INDEX IF NOT EXISTS idx_payments_tool ON payments(tool_id);
`);

console.log('Database initialized at', DB_PATH);
module.exports = db;
