const Database = require('better-sqlite3');
const path = require('path');
const seedData = require('./seedData.json');

const DB_PATH = path.join(__dirname, '..', 'gwoe.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (business_unit_id) REFERENCES business_units(id)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      role_name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('L1','L2','L3','L4')),
      candidate_for_offshore TEXT NOT NULL DEFAULT 'N' CHECK(candidate_for_offshore IN ('Y','N')),
      recommendation TEXT NOT NULL DEFAULT 'N' CHECK(recommendation IN ('Y','N','P')),
      qualitative_why TEXT,
      current_fte REAL NOT NULL DEFAULT 0,
      estimated_spend REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      insight_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed if empty
  const count = db.prepare('SELECT COUNT(*) as cnt FROM business_units').get();
  if (count.cnt === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertBU = db.prepare('INSERT INTO business_units (id, name, description) VALUES (?, ?, ?)');
  const insertDept = db.prepare('INSERT INTO departments (business_unit_id, name) VALUES (?, ?)');
  const insertRole = db.prepare('INSERT INTO roles (department_id, role_name, level, candidate_for_offshore, recommendation, qualitative_why, current_fte, estimated_spend) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  const seedAll = db.transaction(() => {
    for (const bu of seedData.businessUnits) {
      insertBU.run(bu.id, bu.name, bu.description);
      for (const dept of bu.departments) {
        const result = insertDept.run(bu.id, dept.name);
        const deptId = result.lastInsertRowid;
        for (const role of dept.roles) {
          insertRole.run(
            deptId,
            role.roleName,
            role.level,
            role.candidateForOffshore,
            role.recommendation,
            role.qualitativeWhy,
            role.currentFTE,
            role.estimatedSpend
          );
        }
      }
    }
  });

  seedAll();
}

module.exports = { getDb };
