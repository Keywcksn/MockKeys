const path = require('path');

const config = {
  port: process.env.PORT || 3008,
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'db', 'data.sqlite'),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
};

module.exports = config;
