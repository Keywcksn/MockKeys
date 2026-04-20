const { getDB, saveDB } = require('./database');

function listEndpoints() {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM endpoints ORDER BY createdAt DESC');
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    row.response = JSON.parse(row.response);
    rows.push(row);
  }
  stmt.free();
  return rows;
}

function findEndpointBySlugAndMethod(slug, method) {
  const db = getDB();
  // Try exact match first
  let stmt = db.prepare('SELECT * FROM endpoints WHERE slug = ? AND method = ?');
  stmt.bind([slug, method]);
  let endpoint = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();

  // If not found, try with trailing slash stripped
  if (!endpoint) {
    const normalizedSlug = slug.replace(/\/$/, '');
    stmt = db.prepare('SELECT * FROM endpoints WHERE slug = ? AND method = ?');
    stmt.bind([normalizedSlug, method]);
    endpoint = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
  }

  return endpoint;
}

function findEndpointById(id) {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM endpoints WHERE id = ?');
  stmt.bind([id]);
  const endpoint = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return endpoint;
}

function createEndpoint({ id, slug, method, statusCode, response, createdAt }) {
  const db = getDB();
  db.run(
    'INSERT INTO endpoints (id, slug, method, statusCode, response, createdAt, hits) VALUES (?, ?, ?, ?, ?, ?, 0)',
    [id, slug, method, statusCode, JSON.stringify(response), createdAt]
  );
  saveDB();
}

function updateEndpoint(id, { slug, method, statusCode, response }) {
  const db = getDB();
  db.run(
    'UPDATE endpoints SET slug = ?, method = ?, statusCode = ?, response = ? WHERE id = ?',
    [slug, method, statusCode, JSON.stringify(response), id]
  );
  saveDB();
}

function deleteEndpoint(id) {
  const db = getDB();
  db.run('DELETE FROM endpoints WHERE id = ?', [id]);
  saveDB();
}

function incrementHits(id) {
  const db = getDB();
  db.run('UPDATE endpoints SET hits = hits + 1 WHERE id = ?', [id]);
  saveDB();
}

function slugMethodExists(slug, method, excludeId = null) {
  const db = getDB();
  const query = excludeId
    ? 'SELECT id FROM endpoints WHERE slug = ? AND method = ? AND id != ?'
    : 'SELECT id FROM endpoints WHERE slug = ? AND method = ?';
  const stmt = db.prepare(query);
  stmt.bind(excludeId ? [slug, method, excludeId] : [slug, method]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

module.exports = {
  listEndpoints,
  findEndpointBySlugAndMethod,
  findEndpointById,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  incrementHits,
  slugMethodExists
};
