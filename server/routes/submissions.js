const express = require('express');
const { getSubmissions, createSubmission, updateSubmissionStatus } = require('../db/models');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// POST /api/submit
router.post('/', (req, res) => {
  const { name, description, link, pricing, contact, category, protocols } = req.body || {};
  if (!name || !link || !contact) {
    return res.status(400).json({
      error: 'validation_failed',
      message: 'Required: name, link, contact. Optional: description, pricing, category, protocols.'
    });
  }
  const result = createSubmission({ name, description, link, pricing, contact, category, protocols: JSON.stringify(protocols || []) });
  res.status(201).json({
    ok: true,
    message: 'Submitted! You will hear from the founders.',
    id: result.lastInsertRowid,
    position: getSubmissions().length
  });
});

// GET /api/submissions (admin only)
router.get('/', requireAdmin, (req, res) => {
  const { status } = req.query;
  const subs = getSubmissions(status);
  res.json({ count: subs.length, submissions: subs });
});

// PATCH /api/submissions/:id/status (admin only)
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['pending_review', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }
  updateSubmissionStatus(req.params.id, status, 'admin');
  res.json({ ok: true, message: `Submission ${req.params.id} marked as ${status}` });
});

module.exports = router;
