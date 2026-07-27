const express = require('express');
const { getTools, getToolById, getCategories, getStats } = require('../db/models');
const router = express.Router();

// GET /api/tools — Machine-readable catalog
router.get('/', (req, res) => {
  const { category, q, limit, offset, sortBy, order } = req.query;
  const tools = getTools({ category, q, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0, sortBy, order });
  const stats = getStats();
  res.json({
    market: 'toolexchange.ai',
    version: '2.0.0',
    stats,
    count: tools.length,
    tools: tools.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      pricing: t.pricing,
      protocols: JSON.parse(t.protocols || '[]'),
      link: t.link,
      verified: !!t.verified,
      featured: !!t.featured,
      grade: t.overall_score ? {
        overall: t.overall_score,
        reliability: t.reliability_score,
        latency: t.latency_score,
        accuracy: t.accuracy_score,
        security: t.security_score,
        docs: t.docs_score,
        agent_compat: t.agent_compat_score,
        economic: t.economic_score,
        raw_latency_ms: t.raw_latency_ms,
        success_rate: t.success_rate,
        test_count: t.test_count,
        last_tested: t.last_tested_at
      } : null
    })),
    links: {
      submit: '/api/submit (POST)',
      grades: '/api/grades',
      leaderboard: '/api/leaderboard',
      premium: '/api/premium/signal'
    }
  });
});

// GET /api/tools/:id — Single tool detail
router.get('/:id', (req, res) => {
  const tool = getToolById(req.params.id);
  if (!tool) return res.status(404).json({ error: 'not_found' });
  res.json({
    tool: {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      pricing: tool.pricing,
      protocols: JSON.parse(tool.protocols || '[]'),
      link: tool.link,
      verified: !!tool.verified,
      featured: !!tool.featured,
      created_at: tool.created_at,
      grade: tool.overall_score ? {
        overall: tool.overall_score,
        breakdown: {
          reliability: tool.reliability_score,
          latency: tool.latency_score,
          accuracy: tool.accuracy_score,
          security: tool.security_score,
          docs: tool.docs_score,
          agent_compat: tool.agent_compat_score,
          economic: tool.economic_score
        },
        raw_latency_ms: tool.raw_latency_ms,
        success_rate: tool.success_rate,
        test_count: tool.test_count,
        last_tested: tool.last_tested_at
      } : null
    }
  });
});

// GET /api/categories
router.get('/categories', (req, res) => {
  res.json({ categories: getCategories() });
});

// GET /api/stats
router.get('/stats', (req, res) => {
  res.json(getStats());
});

module.exports = router;
