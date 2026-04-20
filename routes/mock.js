const express = require('express');
const router = express.Router();
const endpointController = require('../controllers/endpointController');

router.all('*', endpointController.handleMock);

module.exports = router;
