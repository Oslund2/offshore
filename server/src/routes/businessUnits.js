const express = require('express');
const { getDb } = require('../database');
const router = express.Router();

// GET all business units with departments
router.get('/', (req, res) => {
  const db = getDb();
  const units = db.prepare('SELECT * FROM business_units ORDER BY name').all();
  const depts = db.prepare('SELECT * FROM departments ORDER BY name').all();

  const result = units.map(u => ({
    ...u,
    departments: depts.filter(d => d.business_unit_id === u.id)
  }));

  res.json(result);
});

// GET single business unit with full role data
router.get('/:id', (req, res) => {
  const db = getDb();
  const unit = db.prepare('SELECT * FROM business_units WHERE id = ?').get(req.params.id);
  if (!unit) return res.status(404).json({ error: 'Business unit not found' });

  const departments = db.prepare(`
    SELECT d.*, json_group_array(json_object(
      'id', r.id,
      'role_name', r.role_name,
      'level', r.level,
      'candidate_for_offshore', r.candidate_for_offshore,
      'recommendation', r.recommendation,
      'qualitative_why', r.qualitative_why,
      'current_fte', r.current_fte,
      'estimated_spend', r.estimated_spend
    )) as roles
    FROM departments d
    LEFT JOIN roles r ON r.department_id = d.id
    WHERE d.business_unit_id = ?
    GROUP BY d.id
    ORDER BY d.name
  `).all(req.params.id);

  const result = {
    ...unit,
    departments: departments.map(d => ({
      id: d.id,
      name: d.name,
      roles: JSON.parse(d.roles).filter(r => r.id !== null)
    }))
  };

  res.json(result);
});

module.exports = router;
