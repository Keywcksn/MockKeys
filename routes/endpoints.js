const express = require('express');
const router = express.Router();
const endpointController = require('../controllers/endpointController');
const { validateCreateEndpoint, validateUpdateEndpoint } = require('../middleware/validation');

router.get('/', endpointController.getAllEndpoints);
router.post('/', validateCreateEndpoint, endpointController.createEndpoint);
router.put('/:id', validateUpdateEndpoint, endpointController.updateEndpoint);
router.delete('/:id', endpointController.deleteEndpoint);

module.exports = router;
