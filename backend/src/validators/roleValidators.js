const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  scope: Joi.string().valid("GLOBAL", "STORE").default("STORE"),
  permissions: Joi.array().items(Joi.string()).default([]),
  storeId: Joi.string().optional(),
});

module.exports = { createRoleSchema };
