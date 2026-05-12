const { getDB, saveDB } = require('./database');

function listEndpoints() {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM endpoints ORDER BY createdAt DESC');
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    row.response = JSON.parse(row.response);
    if (row.reqBody) {
      row.reqBody = JSON.parse(row.reqBody);
    }
    if (row.successResponse) {
      row.successResponse = JSON.parse(row.successResponse);
    }
    if (row.failedResponse) {
      row.failedResponse = JSON.parse(row.failedResponse);
    }
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

  // If not found, try with query parameters stripped
  if (!endpoint && slug.includes('?')) {
    const slugWithoutQuery = slug.split('?')[0];
    stmt = db.prepare('SELECT * FROM endpoints WHERE slug = ? AND method = ?');
    stmt.bind([slugWithoutQuery, method]);
    endpoint = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();

    // Also try with both query params and trailing slash stripped
    if (!endpoint && slugWithoutQuery.endsWith('/')) {
      const normalizedSlug = slugWithoutQuery.replace(/\/$/, '');
      stmt = db.prepare('SELECT * FROM endpoints WHERE slug = ? AND method = ?');
      stmt.bind([normalizedSlug, method]);
      endpoint = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
    }
  }

  // Parse JSON fields if endpoint exists
  if (endpoint) {
    endpoint.response = JSON.parse(endpoint.response);
    if (endpoint.reqBody) {
      endpoint.reqBody = JSON.parse(endpoint.reqBody);
    }
    if (endpoint.successResponse) {
      endpoint.successResponse = JSON.parse(endpoint.successResponse);
    }
    if (endpoint.failedResponse) {
      endpoint.failedResponse = JSON.parse(endpoint.failedResponse);
    }
  }

  return endpoint;
}

function findEndpointById(id) {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM endpoints WHERE id = ?');
  stmt.bind([id]);
  const endpoint = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (endpoint) {
    if (endpoint.reqBody) {
      endpoint.reqBody = JSON.parse(endpoint.reqBody);
    }
    if (endpoint.successResponse) {
      endpoint.successResponse = JSON.parse(endpoint.successResponse);
    }
    if (endpoint.failedResponse) {
      endpoint.failedResponse = JSON.parse(endpoint.failedResponse);
    }
  }
  return endpoint;
}

function createEndpoint({ id, slug, method, statusCode, response, createdAt, reqBody, successResponse, failedResponse }) {
  const db = getDB();
  db.run(
    'INSERT INTO endpoints (id, slug, method, statusCode, response, reqBody, successResponse, failedResponse, createdAt, hits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
    [id, slug, method, statusCode, JSON.stringify(response), reqBody ? JSON.stringify(reqBody) : null, successResponse ? JSON.stringify(successResponse) : null, failedResponse ? JSON.stringify(failedResponse) : null, createdAt]
  );
  saveDB();
}

function updateEndpoint(id, { slug, method, statusCode, response, reqBody, successResponse, failedResponse }) {
  const db = getDB();
  db.run(
    'UPDATE endpoints SET slug = ?, method = ?, statusCode = ?, response = ?, reqBody = ?, successResponse = ?, failedResponse = ? WHERE id = ?',
    [slug, method, statusCode, JSON.stringify(response), reqBody ? JSON.stringify(reqBody) : null, successResponse ? JSON.stringify(successResponse) : null, failedResponse ? JSON.stringify(failedResponse) : null, id]
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
