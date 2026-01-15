const Joi = require("joi");

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  roleId: Joi.string().optional(),
  storeId: Joi.string().optional(),
  isMasterAdmin: Joi.boolean().default(false),
});

module.exports = { createUserSchema };
