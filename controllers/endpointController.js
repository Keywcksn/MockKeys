const { v4: uuidv4 } = require('uuid');
const endpointService = require('../services/endpointService');

function getAllEndpoints(req, res) {
  const endpoints = endpointService.listEndpoints();
  res.json(endpoints);
}

function createEndpoint(req, res) {
  const { slug, method, statusCode, reqBody, successResponse, failedResponse, matchValues } = req.body;
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
    createdAt: now,
    reqBody,
    successResponse,
    failedResponse,
    matchValues
  });

  const entry = {
    id,
    slug: cleanSlug,
    method: cleanMethod,
    statusCode: parsedStatusCode,
    response: parsedResponse,
    createdAt: now,
    hits: 0,
    reqBody,
    successResponse,
    failedResponse,
    matchValues: matchValues || false
  };

  res.status(201).json(entry);
}

function updateEndpoint(req, res) {
  const { id } = req.params;
  const { slug, method, statusCode, reqBody, successResponse, failedResponse, matchValues } = req.body;
  const { parsedResponse } = req;

  const existing = endpointService.findEndpointById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }

  const cleanSlug = slug ? slug.replace(/^\/+/, '') : existing.slug;
  const cleanMethod = method ? method.toUpperCase() : existing.method;
  const parsedStatusCode = statusCode ? parseInt(statusCode) : existing.statusCode;
  const response = parsedResponse || existing.response;
  const finalReqBody = reqBody !== undefined ? reqBody : existing.reqBody;
  const finalSuccessResponse = successResponse !== undefined ? successResponse : existing.successResponse;
  const finalFailedResponse = failedResponse !== undefined ? failedResponse : existing.failedResponse;
  const finalMatchValues = matchValues !== undefined ? matchValues : existing.matchValues;

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
    response,
    reqBody: finalReqBody,
    successResponse: finalSuccessResponse,
    failedResponse: finalFailedResponse,
    matchValues: finalMatchValues
  });

  const entry = {
    id: existing.id,
    slug: cleanSlug,
    method: cleanMethod,
    statusCode: parsedStatusCode,
    response,
    reqBody: finalReqBody,
    successResponse: finalSuccessResponse,
    failedResponse: finalFailedResponse,
    matchValues: finalMatchValues,
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

  // Check if request body validation is enabled
  if (endpoint.reqBody) {
    // Extract expected headers from --header key
    const expectedHeaders = endpoint.reqBody['--header'];
    const actualBody = { ...endpoint.reqBody };
    delete actualBody['--header']; // Remove --header key for body comparison

    // Validate headers first (exact value match)
    if (expectedHeaders) {
      const headersMatch = checkHeadersMatch(req.headers, expectedHeaders);
      if (!headersMatch) {
        // Headers don't match
        if (endpoint.failedResponse) {
          return res.status(400).json(endpoint.failedResponse);
        }
        return res.status(400).json(endpoint.response);
      }
    }

    // Then validate body keys (presence check or full match depending on matchValues)
    if (Object.keys(actualBody).length > 0) {
      const bodyMatches = endpoint.matchValues
        ? checkBodyKeysAndValuesMatch(req.body, actualBody)
        : checkBodyKeysExist(req.body, actualBody);

      if (bodyMatches && endpoint.successResponse) {
        return res.status(200).json(endpoint.successResponse);
      } else if (!bodyMatches) {
        if (endpoint.failedResponse) {
          return res.status(400).json(endpoint.failedResponse);
        }
        return res.status(400).json(endpoint.response);
      }
    }

    // Headers match (and no body to validate or body keys exist)
    if (endpoint.successResponse) {
      return res.status(200).json(endpoint.successResponse);
    }
    return res.status(endpoint.statusCode).json(endpoint.response);
  }

  // No request body validation, use default response
  res.status(endpoint.statusCode).json(endpoint.response);
}

// Helper function to check if headers match (exact value)
function checkHeadersMatch(reqHeaders, expectedHeaders) {
  for (const [key, expectedValue] of Object.entries(expectedHeaders)) {
    // Express headers are case-insensitive, convert to lowercase for comparison
    const actualValue = reqHeaders[key.toLowerCase()] || reqHeaders[key];
    if (actualValue !== expectedValue) {
      return false;
    }
  }
  return true;
}

// Helper function to check if body keys exist (presence check only)
function checkBodyKeysExist(reqBody, expectedBody) {
  for (const key of Object.keys(expectedBody)) {
    if (reqBody[key] === undefined) {
      return false;
    }
  }
  return true;
}

// Helper function to check if body keys and values match exactly
function checkBodyKeysAndValuesMatch(reqBody, expectedBody) {
  for (const [key, expectedValue] of Object.entries(expectedBody)) {
    if (reqBody[key] === undefined) {
      return false;
    }
    if (reqBody[key] !== expectedValue) {
      return false;
    }
  }
  return true;
}

module.exports = {
  getAllEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  handleMock,
  checkHeadersMatch,
  checkBodyKeysExist
};
