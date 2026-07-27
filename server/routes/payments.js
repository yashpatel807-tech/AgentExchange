const express = require('express');
const { recordPayment, getPayments } = require('../db/models');
const router = express.Router();

// GET /api/payments
router.get('/', (req, res) => {
  const { tool_id } = req.query;
  const payments = getPayments(tool_id ? parseInt(tool_id) : null);
  res.json({
    count: payments.length,
    total_volume_usd: payments.reduce((sum, p) => sum + parseFloat(p.amount_usd || 0), 0).toFixed(4),
    payments: payments.map(p => ({
      id: p.id,
      tool_id: p.tool_id,
      payer: p.payer_address,
      amount_usd: p.amount_usd,
      tx_hash: p.tx_hash,
      network: p.network,
      status: p.status,
      created_at: p.created_at
    }))
  });
});

module.exports = router;
