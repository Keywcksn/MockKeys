const SLUG_REGEX = /^[a-z0-9\-_\/\?\=\&]+$/i;

function validateCreateEndpoint(req, res, next) {
  const { slug, method, response, reqBody, successResponse, failedResponse, matchValues } = req.body;

  if (!slug || !method || !response) {
    return res.status(400).json({ error: 'slug, method, and response are required' });
  }

  if (!SLUG_REGEX.test(slug)) {
    return res.status(400).json({
      error: 'Slug can only contain letters, numbers, hyphens, underscores, slashes, and query parameters (?, =, &)'
    });
  }

  try {
    const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
    req.parsedResponse = parsedResponse;

    // Parse optional JSON fields
    if (reqBody) {
      req.body.reqBody = typeof reqBody === 'string' ? JSON.parse(reqBody) : reqBody;
    }
    if (successResponse) {
      req.body.successResponse = typeof successResponse === 'string' ? JSON.parse(successResponse) : successResponse;
    }
    if (failedResponse) {
      req.body.failedResponse = typeof failedResponse === 'string' ? JSON.parse(failedResponse) : failedResponse;
    }

    req.body.matchValues = matchValues === true || matchValues === 1 || matchValues === 'true';

    next();
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in response body or request body fields' });
  }
}

function validateUpdateEndpoint(req, res, next) {
  const { response, reqBody, successResponse, failedResponse, matchValues } = req.body;

  if (response !== undefined) {
    try {
      const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
      req.parsedResponse = parsedResponse;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in response body' });
    }
  }

  // Parse optional JSON fields if provided
  try {
    if (reqBody !== undefined) {
      req.body.reqBody = typeof reqBody === 'string' ? JSON.parse(reqBody) : reqBody;
    }
    if (successResponse !== undefined) {
      req.body.successResponse = typeof successResponse === 'string' ? JSON.parse(successResponse) : successResponse;
    }
    if (failedResponse !== undefined) {
      req.body.failedResponse = typeof failedResponse === 'string' ? JSON.parse(failedResponse) : failedResponse;
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in request body fields' });
  }

  if (matchValues !== undefined) {
    req.body.matchValues = matchValues === true || matchValues === 1 || matchValues === 'true';
  }

  const { slug } = req.body;
  if (slug && !SLUG_REGEX.test(slug)) {
    return res.status(400).json({
      error: 'Slug can only contain letters, numbers, hyphens, underscores, slashes, and query parameters (?, =, &)'
    });
  }

  next();
}

module.exports = {
  validateCreateEndpoint,
  validateUpdateEndpoint
};
