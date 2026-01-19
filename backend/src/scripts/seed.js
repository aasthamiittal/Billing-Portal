const mongoose = require("mongoose");
const env = require("../config/env");
const Role = require("../models/Role");
const User = require("../models/User");
const Industry = require("../models/Industry");
const Store = require("../models/Store");
const permissionSchema = require("../config/permissionSchema");

const LEVELS = { show: 1, read_only: 2, download: 2, read_write: 3 };
const pickMaxLevel = (levels = []) => {
  const set = new Set(levels);
  // highest to lowest
  if (set.has("read_write")) return "read_write";
  if (set.has("download")) return "download";
  if (set.has("read_only")) return "read_only";
  if (set.has("show")) return "show";
  return "read_write";
};

const buildMasterPermissions = () => {
  const perms = {};
  Object.entries(permissionSchema.modules || {}).forEach(([moduleKey, defs]) => {
    perms[moduleKey] = {};
    (defs || []).forEach((d) => {
      perms[moduleKey][d.action] = pickMaxLevel(d.levels || []);
    });
  });
  // Master should be able to access master-only features too.
  if (!perms.users) perms.users = {};
  perms.users.permissions = "read_write";
  return perms;
};

const run = async () => {
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });

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
      description: "Root administrator with full access",
      scope: "GLOBAL",
      permissions: buildMasterPermissions(),
      isActive: true,
    });
  } else if (!role.permissions || Object.keys(role.permissions).length === 0) {
    role.permissions = buildMasterPermissions();
    await role.save();
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
