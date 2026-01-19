const Joi = require("joi");

const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().allow("", null).default(""),
  storeId: Joi.string().optional(), // master only
});

const updateCategorySchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().allow("", null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createCategorySchema, updateCategorySchema };

