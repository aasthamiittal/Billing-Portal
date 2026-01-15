const mongoose = require("mongoose");
const env = require("../config/env");

const Permission = require("../models/Permission");
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

const models = [
  Permission,
  Role,
  Industry,
  Store,
  User,
  Item,
  SKU,
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
