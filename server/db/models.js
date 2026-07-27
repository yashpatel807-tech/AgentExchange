const db = require('./init');

// Tools
function getTools({ category, q, limit = 50, offset = 0, sortBy = 'overall_score', order = 'DESC' } = {}) {
  let sql = `
    SELECT t.*, g.overall_score, g.reliability_score, g.latency_score, g.accuracy_score,
           g.security_score, g.docs_score, g.agent_compat_score, g.economic_score,
           g.raw_latency_ms, g.success_rate, g.last_tested_at, g.test_count
    FROM tools t
    LEFT JOIN grades g ON t.id = g.tool_id
    WHERE 1=1
  `;
  const params = [];
  if (category) {
    sql += ' AND t.category = ?';
    params.push(category);
  }
  if (q) {
    sql += ` AND (t.name LIKE ? OR t.description LIKE ? OR t.category LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY ${sortBy === 'name' ? 't.name' : 'COALESCE(g.overall_score, 0)'} ${order}`;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function getToolById(id) {
  return db.prepare(`
    SELECT t.*, g.* FROM tools t
    LEFT JOIN grades g ON t.id = g.tool_id
    WHERE t.id = ?
  `).get(id);
}

function getToolByName(name) {
  return db.prepare('SELECT * FROM tools WHERE name = ?').get(name);
}

function createTool(data) {
  const stmt = db.prepare(`
    INSERT INTO tools (name, description, category, pricing, protocols, link, verified, featured)
    VALUES (@name, @description, @category, @pricing, @protocols, @link, @verified, @featured)
  `);
  return stmt.run(data);
}

function updateTool(id, data) {
  const keys = Object.keys(data).filter(k => k !== 'id');
  const setClause = keys.map(k => `${k} = @${k}`).join(', ');
  const stmt = db.prepare(`UPDATE tools SET ${setClause}, updated_at = datetime('now') WHERE id = @id`);
  return stmt.run({ ...data, id });
}

function getCategories() {
  return db.prepare('SELECT DISTINCT category FROM tools ORDER BY category').all().map(r => r.category);
}

function getStats() {
  const tools = db.prepare('SELECT COUNT(*) as count FROM tools').get();
  const graded = db.prepare('SELECT COUNT(*) as count FROM grades WHERE overall_score IS NOT NULL').get();
  const submissions = db.prepare('SELECT COUNT(*) as count FROM submissions WHERE status = ?').get('pending_review');
  const avgScore = db.prepare('SELECT AVG(overall_score) as avg FROM grades WHERE overall_score IS NOT NULL').get();
  return {
    totalTools: tools.count,
    gradedTools: graded.count,
    pendingSubmissions: submissions.count,
    averageScore: Math.round(avgScore.avg || 0)
  };
}

// Submissions
function getSubmissions(status) {
  let sql = 'SELECT * FROM submissions';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

function createSubmission(data) {
  const stmt = db.prepare(`
    INSERT INTO submissions (name, description, link, pricing, contact, category, protocols)
    VALUES (@name, @description, @link, @pricing, @contact, @category, @protocols)
  `);
  return stmt.run(data);
}

function updateSubmissionStatus(id, status, reviewer) {
  return db.prepare(`
    UPDATE submissions SET status = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?
  `).run(status, reviewer, id);
}

// Grades
function getGradeByToolId(toolId) {
  return db.prepare('SELECT * FROM grades WHERE tool_id = ?').get(toolId);
}

function getGrades({ category, minScore, limit = 50 } = {}) {
  let sql = `
    SELECT g.*, t.name, t.category, t.pricing, t.link, t.verified
    FROM grades g
    JOIN tools t ON g.tool_id = t.id
    WHERE g.overall_score IS NOT NULL
  `;
  const params = [];
  if (category) {
    sql += ' AND t.category = ?';
    params.push(category);
  }
  if (minScore) {
    sql += ' AND g.overall_score >= ?';
    params.push(minScore);
  }
  sql += ' ORDER BY g.overall_score DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

function getGradeHistory(toolId, limit = 30) {
  return db.prepare(`
    SELECT * FROM grade_history WHERE tool_id = ? ORDER BY recorded_at DESC LIMIT ?
  `).all(toolId, limit);
}

function saveGrade(data) {
  const existing = getGradeByToolId(data.tool_id);
  if (existing) {
    // Archive current to history
    db.prepare(`
      INSERT INTO grade_history (tool_id, overall_score, reliability_score, latency_score)
      VALUES (?, ?, ?, ?)
    `).run(existing.tool_id, existing.overall_score, existing.reliability_score, existing.latency_score);

    // Update grade
    const keys = Object.keys(data).filter(k => k !== 'tool_id' && k !== 'id');
    const setClause = keys.map(k => `${k} = @${k}`).join(', ');
    const stmt = db.prepare(`UPDATE grades SET ${setClause}, test_count = test_count + 1, last_tested_at = datetime('now') WHERE tool_id = @tool_id`);
    return stmt.run(data);
  } else {
    const stmt = db.prepare(`
      INSERT INTO grades (tool_id, overall_score, reliability_score, latency_score, accuracy_score, security_score, docs_score, agent_compat_score, economic_score, test_results, raw_latency_ms, success_rate, test_count)
      VALUES (@tool_id, @overall_score, @reliability_score, @latency_score, @accuracy_score, @security_score, @docs_score, @agent_compat_score, @economic_score, @test_results, @raw_latency_ms, @success_rate, 1)
    `);
    return stmt.run(data);
  }
}

// Leaderboard
function getLeaderboard(category, limit = 10) {
  let sql = `
    SELECT g.overall_score, g.reliability_score, g.latency_score, g.test_count,
           t.id, t.name, t.category, t.pricing, t.verified
    FROM grades g
    JOIN tools t ON g.tool_id = t.id
    WHERE g.overall_score IS NOT NULL
  `;
  const params = [];
  if (category) {
    sql += ' AND t.category = ?';
    params.push(category);
  }
  sql += ' ORDER BY g.overall_score DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

// Payments
function recordPayment(data) {
  const stmt = db.prepare(`
    INSERT INTO payments (tool_id, payer_address, amount_usd, amount_wei, tx_hash, network, status)
    VALUES (@tool_id, @payer_address, @amount_usd, @amount_wei, @tx_hash, @network, @status)
  `);
  return stmt.run(data);
}

function getPayments(toolId) {
  let sql = 'SELECT * FROM payments';
  const params = [];
  if (toolId) {
    sql += ' WHERE tool_id = ?';
    params.push(toolId);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

module.exports = {
  getTools, getToolById, getToolByName, createTool, updateTool,
  getCategories, getStats,
  getSubmissions, createSubmission, updateSubmissionStatus,
  getGradeByToolId, getGrades, getGradeHistory, saveGrade,
  getLeaderboard,
  recordPayment, getPayments
};
