const db = require('../db/init');

function requireAdmin(req, res, next) {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== (process.env.ADMIN_TOKEN || 'changeme')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or missing admin token' });
  }
  next();
}

function requireApiKey(req, res, next) {
  const key = req.query.api_key || req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'unauthorized', message: 'API key required' });
  }
  const record = db.prepare('SELECT * FROM api_keys WHERE key = ?').get(key);
  if (!record) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid API key' });
  }
  if (record.usage_count >= record.rate_limit) {
    return res.status(429).json({ error: 'rate_limited', message: 'Rate limit exceeded' });
  }
  db.prepare('UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = ?').run(record.id);
  req.apiKey = record;
  next();
}

module.exports = { requireAdmin, requireApiKey };
