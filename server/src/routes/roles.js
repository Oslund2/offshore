const express = require('express');
const { getDb } = require('../database');
const router = express.Router();

// GET all roles for a department
router.get('/department/:deptId', (req, res) => {
  const db = getDb();
  const roles = db.prepare('SELECT * FROM roles WHERE department_id = ? ORDER BY level, role_name').all(req.params.deptId);
  res.json(roles);
});

// POST create new role
router.post('/', (req, res) => {
  const db = getDb();
  const { department_id, role_name, level, candidate_for_offshore, recommendation, qualitative_why, current_fte, estimated_spend } = req.body;

  if (!department_id || !role_name || !level) {
    return res.status(400).json({ error: 'department_id, role_name, and level are required' });
  }

  const result = db.prepare(`
    INSERT INTO roles (department_id, role_name, level, candidate_for_offshore, recommendation, qualitative_why, current_fte, estimated_spend)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    department_id,
    role_name,
    level,
    candidate_for_offshore || 'N',
    recommendation || 'N',
    qualitative_why || '',
    current_fte || 0,
    estimated_spend || 0
  );

  const newRole = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newRole);
});

// PUT update role
router.put('/:id', (req, res) => {
  const db = getDb();
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });

  const { role_name, level, candidate_for_offshore, recommendation, qualitative_why, current_fte, estimated_spend } = req.body;

  db.prepare(`
    UPDATE roles SET
      role_name = COALESCE(?, role_name),
      level = COALESCE(?, level),
      candidate_for_offshore = COALESCE(?, candidate_for_offshore),
      recommendation = COALESCE(?, recommendation),
      qualitative_why = COALESCE(?, qualitative_why),
      current_fte = COALESCE(?, current_fte),
      estimated_spend = COALESCE(?, estimated_spend)
    WHERE id = ?
  `).run(
    role_name, level, candidate_for_offshore, recommendation,
    qualitative_why, current_fte, estimated_spend, req.params.id
  );

  const updated = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE role
router.delete('/:id', (req, res) => {
  const db = getDb();
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });

  db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
