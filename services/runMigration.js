const fs = require('fs');
const { initDB, getSQL } = require('./database.js');
const config = require('../config');

async function runMigration() {
  await initDB();
  const SQL = getSQL();

  if (!fs.existsSync(config.dbPath)) {
    console.log('Database does not exist. Skipping migration.');
    return;
  }

  const fileBuffer = fs.readFileSync(config.dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // PRAGMA table_info returns: [{ columns: [...], values: [[cid, name, type, ...], ...] }]
    const tableInfo = db.exec("PRAGMA table_info(endpoints)");
    const columns = tableInfo[0]?.values.map(row => row[1]) ?? [];

    const hasReqBody = columns.includes('reqBody');
    const hasSuccessResponse = columns.includes('successResponse');
    const hasFailedResponse = columns.includes('failedResponse');

    if (hasReqBody && hasSuccessResponse && hasFailedResponse) {
      console.log('Migration already applied. Skipping.');
      db.close();
      return;
    }

    console.log('Adding reqBody, successResponse, and failedResponse columns...');

    db.run("BEGIN");

    if (!hasReqBody) {
      db.run("ALTER TABLE endpoints ADD COLUMN reqBody TEXT");
      console.log('  + reqBody');
    }

    if (!hasSuccessResponse) {
      db.run("ALTER TABLE endpoints ADD COLUMN successResponse TEXT");
      console.log('  + successResponse');
    }

    if (!hasFailedResponse) {
      db.run("ALTER TABLE endpoints ADD COLUMN failedResponse TEXT");
      console.log('  + failedResponse');
    }

    db.run("COMMIT");

    // Write to a temp file first, then rename to avoid data loss on crash
    const data = db.export();
    const buffer = Buffer.from(data);
    const tmpPath = config.dbPath + '.tmp';
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, config.dbPath);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    try {
      db.run("ROLLBACK");
    } catch (_) {
      // Ignore rollback error if transaction wasn't started
    }
    throw err;
  } finally {
    db.close();
  }
}

module.exports = { runMigration };

// call the migration script if this file is run directly
runMigration()
  .then(() => {
    // let Node exit on its own
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });