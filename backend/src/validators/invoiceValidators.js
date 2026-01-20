const Joi = require("joi");

const invoiceItemSchema = Joi.object({
  item: Joi.string().optional(),
  sku: Joi.string().optional(),
  description: Joi.string().allow("", null),
  quantity: Joi.number().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  taxRate: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
});

const createInvoiceSchema = Joi.object({
  storeId: Joi.string().required(),
  industryId: Joi.string().optional(),
  customerName: Joi.string().allow("", null),
  customerEmail: Joi.string().allow("", null),
  currency: Joi.string().default("INR"),
  notes: Joi.string().allow("", null),
  orderTypeId: Joi.string().required(),
  paymentTypeId: Joi.string().required(),
  discountId: Joi.string().required(),
  // Discount percent (0-100)
  discountValue: Joi.number().min(0).max(100).optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
});

module.exports = { createInvoiceSchema };
