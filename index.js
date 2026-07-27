require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Initialize DB first
require('./db/init');

const { getStats } = require('./db/models');
const toolsRouter = require('./routes/tools');
const submissionsRouter = require('./routes/submissions');
const gradesRouter = require('./routes/grades');
const leaderboardRouter = require('./routes/leaderboard');
const paymentsRouter = require('./routes/payments');

const app = express();

// Security & performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openrouter.ai"]
    }
  }
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'rate_limited', message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/tools', toolsRouter);
app.use('/api/submit', submissionsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/payments', paymentsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    market: 'toolexchange.ai',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    stats: getStats()
  });
});

// x402 Premium Signal
const X402_ENABLED = process.env.X402_ENABLED === 'true';
if (X402_ENABLED) {
  try {
    const { paymentMiddleware } = require('x402-express');
    app.use(paymentMiddleware(
      process.env.PAY_TO,
      { 'GET /api/premium/signal': { price: '$0.005', network: process.env.X402_NETWORK || 'base-sepolia' } }
    ));
    console.log('✅ x402 payment middleware enabled');
  } catch (e) {
    console.warn('⚠️ x402 middleware failed to load:', e.message);
  }
}

app.get('/api/premium/signal', (req, res) => {
  const stats = getStats();
  res.json({
    product: 'toolexchange.ai Premium Signal',
    signal: {
      timestamp: new Date().toISOString(),
      toolsIndexed: stats.totalTools,
      gradedTools: stats.gradedTools,
      averageScore: stats.averageScore,
      hottestCategory: 'Payments',
      note: 'A machine just paid a machine. Welcome to the settlement layer.'
    },
    paid: X402_ENABLED,
    market: 'toolexchange.ai'
  });
});

// Grader trigger endpoint (admin only)
const { requireAdmin } = require('./middleware/auth');
const { runGrader } = require('../grader/runner');
app.post('/api/admin/grade', requireAdmin, async (req, res) => {
  const { toolId, all } = req.body;
  try {
    const results = await runGrader({ toolId, all });
    res.json({ ok: true, graded: results.length, results });
  } catch (e) {
    res.status(500).json({ error: 'grader_failed', message: e.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 toolexchange.ai live on port ${PORT}`);
  console.log(`📊 Stats:`, getStats());
});

module.exports = app;
