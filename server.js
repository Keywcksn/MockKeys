const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { initDB } = require('./services/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const endpointController = require('./controllers/endpointController');

const endpointsRouter = require('./routes/endpoints');

const app = express();

app.use(cors(config.cors));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
