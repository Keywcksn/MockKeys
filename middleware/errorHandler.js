function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Not Found' });
}

module.exports = {
  errorHandler,
  notFound
};
