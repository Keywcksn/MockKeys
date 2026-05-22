const fs = require('fs');
const { initDB } = require('../services/database.js');
const config = require('../config');

async function migrate() {
  await initDB();

  const { getSQL } = require('../services/database.js');
  const SQL = getSQL();

  if (!fs.existsSync(config.dbPath)) {
    console.log('Database does not exist. Nothing to migrate.');
    return;
  }

  const fileBuffer = fs.readFileSync(config.dbPath);
  const db = new SQL.Database(fileBuffer);

  const tableInfo = db.exec("PRAGMA table_info(endpoints)");
  const hasMatchValues = tableInfo.some(row => row.name === 'matchValues');

  if (hasMatchValues) {
    console.log('Migration already applied. Skipping.');
    return;
  }

  console.log('Adding matchValues column...');

  db.run("ALTER TABLE endpoints ADD COLUMN matchValues INTEGER DEFAULT 0");

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);

  console.log('Migration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
