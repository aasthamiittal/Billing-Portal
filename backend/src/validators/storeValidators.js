const Joi = require("joi");

const createStoreSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  industryId: Joi.string().required(),
  parentStoreId: Joi.string().allow(null, ""),
  settings: Joi.object().default({}),
});

module.exports = { createStoreSchema };
