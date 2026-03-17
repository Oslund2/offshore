const express = require('express');
const { getDb } = require('../database');
const router = express.Router();

// GET global rollup
router.get('/rollup', (req, res) => {
  const db = getDb();

  const overall = db.prepare(`
    SELECT
      COUNT(*) as total_roles,
      SUM(current_fte) as total_fte,
      SUM(estimated_spend) as total_spend,
      SUM(CASE WHEN recommendation = 'Y' THEN current_fte ELSE 0 END) as offshore_fte,
      SUM(CASE WHEN recommendation = 'Y' THEN estimated_spend ELSE 0 END) as offshore_spend,
      SUM(CASE WHEN recommendation = 'P' THEN current_fte ELSE 0 END) as partial_fte,
      SUM(CASE WHEN recommendation = 'P' THEN estimated_spend ELSE 0 END) as partial_spend,
      SUM(CASE WHEN recommendation = 'N' THEN current_fte ELSE 0 END) as retain_fte,
      SUM(CASE WHEN recommendation = 'N' THEN estimated_spend ELSE 0 END) as retain_spend
    FROM roles
  `).get();

  const byUnit = db.prepare(`
    SELECT
      bu.id,
      bu.name,
      COUNT(r.id) as total_roles,
      SUM(r.current_fte) as total_fte,
      SUM(r.estimated_spend) as total_spend,
      SUM(CASE WHEN r.recommendation = 'Y' THEN r.current_fte ELSE 0 END) as offshore_fte,
      SUM(CASE WHEN r.recommendation = 'Y' THEN r.estimated_spend ELSE 0 END) as offshore_spend,
      SUM(CASE WHEN r.recommendation = 'N' THEN r.current_fte ELSE 0 END) as retain_fte
    FROM business_units bu
    JOIN departments d ON d.business_unit_id = bu.id
    JOIN roles r ON r.department_id = d.id
    GROUP BY bu.id
    ORDER BY bu.name
  `).all();

  const byLevel = db.prepare(`
    SELECT
      level,
      COUNT(*) as count,
      SUM(current_fte) as total_fte,
      SUM(CASE WHEN recommendation = 'Y' THEN 1 ELSE 0 END) as offshore_count,
      SUM(CASE WHEN recommendation = 'N' THEN 1 ELSE 0 END) as retain_count
    FROM roles
    GROUP BY level
    ORDER BY level
  `).all();

  res.json({ overall, byUnit, byLevel });
});

// GET unit-specific summary
router.get('/rollup/:unitId', (req, res) => {
  const db = getDb();

  const summary = db.prepare(`
    SELECT
      d.name as department,
      COUNT(r.id) as total_roles,
      SUM(r.current_fte) as total_fte,
      SUM(r.estimated_spend) as total_spend,
      SUM(CASE WHEN r.recommendation = 'Y' THEN r.current_fte ELSE 0 END) as offshore_fte,
      SUM(CASE WHEN r.recommendation = 'Y' THEN r.estimated_spend ELSE 0 END) as offshore_spend
    FROM departments d
    JOIN roles r ON r.department_id = d.id
    WHERE d.business_unit_id = ?
    GROUP BY d.id
    ORDER BY d.name
  `).all(req.params.unitId);

  res.json(summary);
});

module.exports = router;
