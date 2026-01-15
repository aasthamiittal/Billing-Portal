const Joi = require("joi");

const createIndustrySchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  config: Joi.object().default({}),
});

module.exports = { createIndustrySchema };
