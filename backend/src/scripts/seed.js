const mongoose = require("mongoose");
const env = require("../config/env");
const Permission = require("../models/Permission");
const Role = require("../models/Role");
const User = require("../models/User");
const Industry = require("../models/Industry");
const Store = require("../models/Store");
const PERMISSIONS = require("../utils/permissions");

const run = async () => {
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });

  const permissionKeys = Object.values(PERMISSIONS);
  const existing = await Permission.find({ key: { $in: permissionKeys } }).exec();
  const existingKeys = new Set(existing.map((perm) => perm.key));

  const toCreate = permissionKeys
    .filter((key) => !existingKeys.has(key))
    .map((key) => ({ key, description: key, module: "core" }));

  if (toCreate.length) {
    await Permission.insertMany(toCreate);
  }

  const permissions = await Permission.find({ key: { $in: permissionKeys } }).exec();

  let industry = await Industry.findOne({ code: "RETAIL" }).exec();
  if (!industry) {
    industry = await Industry.create({ name: "Retail", code: "RETAIL" });
  }

  let store = await Store.findOne({ code: "MAIN", industry: industry._id }).exec();
  if (!store) {
    store = await Store.create({
      name: "Main Store",
      code: "MAIN",
      industry: industry._id,
    });
  }

  let role = await Role.findOne({ name: "Master Admin", scope: "GLOBAL" }).exec();
  if (!role) {
    role = await Role.create({
      name: "Master Admin",
      scope: "GLOBAL",
      permissions: permissions.map((perm) => perm._id),
    });
  }

  const adminEmail = "admin@example.com";
  const oldEmail = "admin@billing.local";
  let admin = await User.findOne({ email: adminEmail }).exec();
  if (!admin) {
    admin = await User.findOne({ email: oldEmail }).exec();
    if (admin) {
      admin.email = adminEmail;
      await admin.save();
    } else {
      const passwordHash = await User.hashPassword("Admin@123");
      admin = await User.create({
        name: "Master Admin",
        email: adminEmail,
        passwordHash,
        role: role._id,
        store: store._id,
        isMasterAdmin: true,
      });
    }
  }

  console.log("Seed completed.");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
