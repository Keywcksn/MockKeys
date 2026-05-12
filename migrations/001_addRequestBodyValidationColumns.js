const fs = require('fs');
const { initDB } = require('../services/database.js');
const config = require('../config');

async function migrate() {
  // Initialize database (this sets up SQL and db internally)
  await initDB();

  // Now we can use getSQL() to get the SQL instance
  const { getSQL } = require('../services/database.js');
  const SQL = getSQL();

  if (!fs.existsSync(config.dbPath)) {
    console.log('Database does not exist. Nothing to migrate.');
    return;
  }

  const fileBuffer = fs.readFileSync(config.dbPath);
  const db = new SQL.Database(fileBuffer);

  // Check if columns already exist
  const tableInfo = db.exec("PRAGMA table_info(endpoints)");
  const hasReqBody = tableInfo.some(row => row.name === 'reqBody');
  const hasSuccessResponse = tableInfo.some(row => row.name === 'successResponse');
  const hasFailedResponse = tableInfo.some(row => row.name === 'failedResponse');

  if (hasReqBody && hasSuccessResponse && hasFailedResponse) {
    console.log('Migration already applied. Skipping.');
    return;
  }

  console.log('Adding reqBody, successResponse, and failedResponse columns...');

  db.run("ALTER TABLE endpoints ADD COLUMN reqBody TEXT", (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Failed to add reqBody column:", err);
    }
  });

  db.run("ALTER TABLE endpoints ADD COLUMN successResponse TEXT", (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Failed to add successResponse column:", err);
    }
  });

  db.run("ALTER TABLE endpoints ADD COLUMN failedResponse TEXT", (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error("Failed to add failedResponse column:", err);
    }
  });

  // Save migrated database
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);

  console.log('Migration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
