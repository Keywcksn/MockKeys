const fs = require('fs');
const initSqlJs = require('sql.js');
const config = require('../config');

let db = null;
let SQL = null;

const TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS endpoints (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    method TEXT NOT NULL,
    statusCode INTEGER DEFAULT 200,
    response TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    hits INTEGER DEFAULT 0,
    matchValues INTEGER DEFAULT 0
  )
`;

const INDEX_SCHEMA = `CREATE UNIQUE INDEX IF NOT EXISTS idx_slug_method ON endpoints(slug, method)`;

async function initDB() {
  SQL = await initSqlJs();

  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    db.run(TABLE_SCHEMA);
    db.run(INDEX_SCHEMA);
    saveDB();
  }
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function getSQL() {
  if (!SQL) {
    throw new Error('SQL.js not initialized');
  }
  return SQL;
}

module.exports = {
  initDB,
  saveDB,
  getDB,
  getSQL
};
