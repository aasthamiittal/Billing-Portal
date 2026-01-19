const Joi = require("joi");

const createStoreSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  industryId: Joi.string().required(),
  parentStoreId: Joi.string().allow(null, ""),
  settings: Joi.object().default({}),
  // Root-only: optionally set the password for auto-provisioned store users.
  defaultUserPassword: Joi.string().min(8).allow("", null).optional(),
});

module.exports = { createStoreSchema };
