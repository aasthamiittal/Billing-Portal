const Role = require("../models/Role");
const Permission = require("../models/Permission");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");

const listRoles = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user.isMasterAdmin) {
    filter.$or = [{ scope: "GLOBAL" }, { store: req.user.store }];
  }
  const roles = await Role.find(filter).populate("permissions").exec();
  res.json(roles);
});

const createRole = asyncHandler(async (req, res) => {
  const { name, scope, permissions, storeId } = req.body;

  if (scope === "GLOBAL" && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can create global roles");
  }

  const permissionDocs = await Permission.find({
    _id: { $in: permissions },
  }).exec();

  const role = await Role.create({
    name,
    scope,
    permissions: permissionDocs.map((perm) => perm._id),
    store: scope === "STORE" ? storeId || req.user.store : undefined,
  });

  res.status(201).json(role);
});

module.exports = { listRoles, createRole };
