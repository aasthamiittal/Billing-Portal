const Joi = require("joi");

const createItemSchema = Joi.object({
  name: Joi.string().required(),
  categoryId: Joi.string().required(),
  taxId: Joi.string().required(),
  description: Joi.string().allow("", null),
  industryId: Joi.string().required(),
  storeId: Joi.string().optional(),
  defaultPrice: Joi.number().min(0).default(0),
  attributes: Joi.object().default({}),
});

const updateItemSchema = Joi.object({
  name: Joi.string().optional(),
  categoryId: Joi.string().optional(),
  taxId: Joi.string().optional(),
  description: Joi.string().allow("", null),
  industryId: Joi.string().optional(),
  storeId: Joi.string().optional(),
  defaultPrice: Joi.number().min(0).optional(),
  attributes: Joi.object().optional(),
});

module.exports = { createItemSchema, updateItemSchema };
