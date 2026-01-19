const mongoose = require("mongoose");
const env = require("../config/env");

const Role = require("../models/Role");
const Industry = require("../models/Industry");
const Store = require("../models/Store");
const User = require("../models/User");
const Item = require("../models/Item");
const SKU = require("../models/Sku");
const Invoice = require("../models/Invoice");
const InvoiceItem = require("../models/InvoiceItem");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const RefreshToken = require("../models/RefreshToken");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const Buyer = require("../models/Buyer");
const StockTransaction = require("../models/StockTransaction");
const InventorySnapshot = require("../models/InventorySnapshot");

const models = [
  Role,
  Industry,
  Store,
  User,
  Item,
  SKU,
  Category,
  Supplier,
  Buyer,
  StockTransaction,
  InventorySnapshot,
  Invoice,
  InvoiceItem,
  Report,
  AuditLog,
  RefreshToken,
];

const run = async () => {
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });

  for (const model of models) {
    await model.createIndexes();
  }

  console.log("Migration completed: indexes ensured.");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});
