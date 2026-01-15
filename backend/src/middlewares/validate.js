const { ApiError } = require("../utils/errors");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return next(
      new ApiError(
        400,
        "Validation error",
        error.details.map((detail) => detail.message)
      )
    );
  }
  req.body = value;
  return next();
};

module.exports = validate;
