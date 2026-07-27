const express = require('express');
const { getLeaderboard, getCategories } = require('../db/models');
const router = express.Router();

// GET /api/leaderboard — Top graded tools
router.get('/', (req, res) => {
  const { category, limit } = req.query;
  const leaders = getLeaderboard(category, parseInt(limit) || 10);
  const categories = getCategories();

  res.json({
    market: 'toolexchange.ai',
    category: category || 'all',
    updated_at: new Date().toISOString(),
    categories,
    count: leaders.length,
    leaderboard: leaders.map((t, i) => ({
      rank: i + 1,
      tool_id: t.id,
      name: t.name,
      category: t.category,
      pricing: t.pricing,
      verified: !!t.verified,
      overall_score: t.overall_score,
      reliability: t.reliability_score,
      latency: t.latency_score,
      test_count: t.test_count
    }))
  });
});

module.exports = router;
