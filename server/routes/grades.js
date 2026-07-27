const express = require('express');
const { getGrades, getGradeHistory, getGradeByToolId } = require('../db/models');
const router = express.Router();

// GET /api/grades — All graded tools with scores
router.get('/', (req, res) => {
  const { category, minScore, limit } = req.query;
  const grades = getGrades({ category, minScore: parseFloat(minScore) || 0, limit: parseInt(limit) || 50 });
  res.json({
    market: 'toolexchange.ai',
    count: grades.length,
    grades: grades.map(g => ({
      tool_id: g.tool_id,
      name: g.name,
      category: g.category,
      pricing: g.pricing,
      verified: !!g.verified,
      overall_score: g.overall_score,
      breakdown: {
        reliability: g.reliability_score,
        latency: g.latency_score,
        accuracy: g.accuracy_score,
        security: g.security_score,
        docs: g.docs_score,
        agent_compat: g.agent_compat_score,
        economic: g.economic_score
      },
      raw_latency_ms: g.raw_latency_ms,
      success_rate: g.success_rate,
      test_count: g.test_count,
      last_tested: g.last_tested_at
    }))
  });
});

// GET /api/grades/:toolId — Grade for specific tool
router.get('/:toolId', (req, res) => {
  const grade = getGradeByToolId(req.params.toolId);
  if (!grade || !grade.overall_score) {
    return res.status(404).json({ error: 'not_graded', message: 'This tool has not been graded yet.' });
  }
  const history = getGradeHistory(req.params.toolId, 30);
  res.json({
    tool_id: grade.tool_id,
    overall_score: grade.overall_score,
    breakdown: {
      reliability: grade.reliability_score,
      latency: grade.latency_score,
      accuracy: grade.accuracy_score,
      security: grade.security_score,
      docs: grade.docs_score,
      agent_compat: grade.agent_compat_score,
      economic: grade.economic_score
    },
    raw_latency_ms: grade.raw_latency_ms,
    success_rate: grade.success_rate,
    test_count: grade.test_count,
    last_tested: grade.last_tested_at,
    history: history.map(h => ({
      overall: h.overall_score,
      reliability: h.reliability_score,
      latency: h.latency_score,
      recorded_at: h.recorded_at
    }))
  });
});

module.exports = router;
