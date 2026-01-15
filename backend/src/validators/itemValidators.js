const Joi = require("joi");

const createItemSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().allow("", null),
  description: Joi.string().allow("", null),
  industryId: Joi.string().required(),
  storeId: Joi.string().optional(),
  defaultPrice: Joi.number().min(0).default(0),
  taxRate: Joi.number().min(0).default(0),
  attributes: Joi.object().default({}),
});

module.exports = { createItemSchema };
