const { ApiError } = require("../utils/errors");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    message,
    details: err.details,
  });
};

module.exports = errorHandler;
