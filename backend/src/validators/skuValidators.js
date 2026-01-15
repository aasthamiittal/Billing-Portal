const Joi = require("joi");

const createSkuSchema = Joi.object({
  itemId: Joi.string().required(),
  skuCode: Joi.string().required(),
  barcode: Joi.string().allow("", null),
  price: Joi.number().min(0).default(0),
  taxRate: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  inventoryQty: Joi.number().min(0).default(0),
  attributes: Joi.object().default({}),
});

module.exports = { createSkuSchema };
