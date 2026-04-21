require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { initDB } = require('./services/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const endpointController = require('./controllers/endpointController');

const endpointsRouter = require('./routes/endpoints');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors(config.cors));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes (public)
app.use('/api/auth', authRouter);

// Protect index.html with JWT authentication
app.get('/index.html', authenticateToken);
app.get('/', authenticateToken, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Key authentication middleware
app.use('/mock/*', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = config.apiKey; // Default fallback

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  if (apiKey !== validApiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
});

app.use('/api/endpoints', endpointsRouter);

// Mock catch-all route - must be after static files
app.all('/mock/*', endpointController.handleMock);

app.use(notFound);
app.use(errorHandler);

initDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`MockAPI running at http://localhost:${config.port}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
