const { v4: uuidv4 } = require('uuid');
const endpointService = require('../services/endpointService');

function getAllEndpoints(req, res) {
  const endpoints = endpointService.listEndpoints();
  res.json(endpoints);
}

function createEndpoint(req, res) {
  const { slug, method, statusCode } = req.body;
  const { parsedResponse } = req;

  const cleanSlug = slug.replace(/^\/+/, '');
  const cleanMethod = method.toUpperCase();
  const parsedStatusCode = parseInt(statusCode) || 200;

  if (endpointService.slugMethodExists(cleanSlug, cleanMethod)) {
    return res.status(409).json({
      error: `A ${cleanMethod} endpoint for /${cleanSlug} already exists`
    });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  endpointService.createEndpoint({
    id,
    slug: cleanSlug,
    method: cleanMethod,
    statusCode: parsedStatusCode,
    response: parsedResponse,
    createdAt: now
  });

  const entry = {
    id,
    slug: cleanSlug,
    method: cleanMethod,
    statusCode: parsedStatusCode,
    response: parsedResponse,
    createdAt: now,
    hits: 0
  };

  res.status(201).json(entry);
}

function updateEndpoint(req, res) {
  const { id } = req.params;
  const { slug, method, statusCode } = req.body;
  const { parsedResponse } = req;

  const existing = endpointService.findEndpointById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }

  const cleanSlug = slug ? slug.replace(/^\/+/, '') : existing.slug;
  const cleanMethod = method ? method.toUpperCase() : existing.method;
  const parsedStatusCode = statusCode ? parseInt(statusCode) : existing.statusCode;
  const response = parsedResponse || JSON.parse(existing.response);

  if (slug || method) {
    if (endpointService.slugMethodExists(cleanSlug, cleanMethod, id)) {
      return res.status(409).json({
        error: `A ${cleanMethod} endpoint for /${cleanSlug} already exists`
      });
    }
  }

  endpointService.updateEndpoint(id, {
    slug: cleanSlug,
    method: cleanMethod,
    statusCode: parsedStatusCode,
    response
  });

  const entry = {
    id: existing.id,
    slug: cleanSlug,
    method: cleanMethod,
    statusCode: parsedStatusCode,
    response,
    createdAt: existing.createdAt,
    hits: existing.hits
  };

  res.json(entry);
}

function deleteEndpoint(req, res) {
  const { id } = req.params;
  const exists = endpointService.findEndpointById(id);

  if (!exists) {
    return res.status(404).json({ error: 'Not found' });
  }

  endpointService.deleteEndpoint(id);
  res.json({ ok: true });
}

function handleMock(req, res) {
  // Strip /mock/ prefix and trailing slashes
  // Use originalUrl to include query parameters
  const reqPath = req.originalUrl.replace(/^\/mock\//, '').replace(/\/$/, '');
  const method = req.method.toUpperCase();

  const endpoint = endpointService.findEndpointBySlugAndMethod(reqPath, method);

  if (!endpoint) {
    return res.status(404).json({
      error: 'No matching mock endpoint found',
      path: req.path,
      method
    });
  }

  endpointService.incrementHits(endpoint.id);
  res.status(endpoint.statusCode).json(JSON.parse(endpoint.response));
}

module.exports = {
  getAllEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  handleMock
};
