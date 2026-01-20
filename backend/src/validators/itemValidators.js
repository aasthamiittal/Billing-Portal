const Joi = require("joi");

const createItemSchema = Joi.object({
  name: Joi.string().required(),
  categoryId: Joi.string().optional(),
  categoryIds: Joi.array().items(Joi.string()).min(1).optional(),
  taxIds: Joi.array().items(Joi.string()).min(1).required(),
  description: Joi.string().allow("", null),
  industryId: Joi.string().required(),
  storeId: Joi.string().optional(),
  defaultPrice: Joi.number().min(0).default(0),
  attributes: Joi.object().default({}),
}).custom((value, helpers) => {
  if (!value.categoryId && (!value.categoryIds || !value.categoryIds.length)) {
    return helpers.error("any.required");
  }
  return value;
}, "category selection validation");

const updateItemSchema = Joi.object({
  name: Joi.string().optional(),
  categoryId: Joi.string().optional(),
  categoryIds: Joi.array().items(Joi.string()).min(1).optional(),
  taxIds: Joi.array().items(Joi.string()).min(1).optional(),
  description: Joi.string().allow("", null),
  industryId: Joi.string().optional(),
  storeId: Joi.string().optional(),
  defaultPrice: Joi.number().min(0).optional(),
  attributes: Joi.object().optional(),
});

module.exports = { createItemSchema, updateItemSchema };
