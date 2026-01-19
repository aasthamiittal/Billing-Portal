const Joi = require("joi");

const createSupplierSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow("", null).default(""),
  email: Joi.string().allow("", null).default(""),
  address: Joi.string().allow("", null).default(""),
  storeId: Joi.string().optional(),
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().allow("", null).optional(),
  email: Joi.string().allow("", null).optional(),
  address: Joi.string().allow("", null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const createBuyerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow("", null).default(""),
  email: Joi.string().allow("", null).default(""),
  address: Joi.string().allow("", null).default(""),
  storeId: Joi.string().optional(),
});

const updateBuyerSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().allow("", null).optional(),
  email: Joi.string().allow("", null).optional(),
  address: Joi.string().allow("", null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const createPurchaseSchema = Joi.object({
  storeId: Joi.string().optional(),
  itemId: Joi.string().required(),
  supplierId: Joi.string().allow("", null).optional(),
  quantity: Joi.number().min(0.0001).required(),
  unitCost: Joi.number().min(0).default(0),
  occurredAt: Joi.date().optional(),
  notes: Joi.string().allow("", null).default(""),
});

const createWastageSchema = Joi.object({
  storeId: Joi.string().optional(),
  itemId: Joi.string().required(),
  quantity: Joi.number().min(0.0001).required(),
  reasonCode: Joi.string().allow("", null).default(""),
  occurredAt: Joi.date().optional(),
  notes: Joi.string().allow("", null).default(""),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
  createBuyerSchema,
  updateBuyerSchema,
  createPurchaseSchema,
  createWastageSchema,
};

