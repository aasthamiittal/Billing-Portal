const User = require("../models/User");
const Role = require("../models/Role");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");

const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user?.store && !req.user.isMasterAdmin) {
    filter.store = req.user.store;
  }
  const users = await User.find(filter)
    .select("-passwordHash")
    .populate("role")
    .exec();
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, storeId, isMasterAdmin } = req.body;

  if (isMasterAdmin && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can create master users");
  }

  const role = roleId ? await Role.findById(roleId).exec() : null;
  const store = storeId ? await Store.findById(storeId).exec() : null;

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role?._id,
    store: store?._id,
    isMasterAdmin: !!isMasterAdmin,
  });

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
  });
});

module.exports = { listUsers, createUser };
