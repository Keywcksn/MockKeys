const SLUG_REGEX = /^[a-z0-9\-_\/\?\=\&]+$/i;

function validateCreateEndpoint(req, res, next) {
  const { slug, method, response } = req.body;

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
    next();
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in response body' });
  }
}

function validateUpdateEndpoint(req, res, next) {
  const { response } = req.body;

  if (response !== undefined) {
    try {
      const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
      req.parsedResponse = parsedResponse;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in response body' });
    }
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
