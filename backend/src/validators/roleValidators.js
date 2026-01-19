const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("", null).default(""),
  scope: Joi.string().valid("GLOBAL", "STORE").default("STORE"),
  permissions: Joi.object().default({}),
  storeId: Joi.string().optional(),
  isActive: Joi.boolean().default(true),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().allow("", null).optional(),
  permissions: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createRoleSchema, updateRoleSchema };
