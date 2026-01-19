const Joi = require("joi");

const kindSchema = Joi.string()
  .valid(
    "taxes",
    "discounts",
    "order-types",
    "payment-types",
    "store-configuration"
  )
  .required();

const createCatalogEntrySchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().allow("", null),
  value: Joi.number().min(0).default(0),
  config: Joi.object().default({}),
  // Master admin only:
  storeId: Joi.string().optional(),
  industryId: Joi.string().optional(),
});

const updateCatalogEntrySchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().allow("", null).optional(),
  value: Joi.number().min(0).optional(),
  config: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = { kindSchema, createCatalogEntrySchema, updateCatalogEntrySchema };

