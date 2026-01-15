const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  const permissions = result.user.role?.permissions?.map((perm) => perm.key) || [];
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role?.name,
      store: result.user.store,
      isMasterAdmin: result.user.isMasterAdmin,
      permissions,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  const permissions = result.user.role?.permissions?.map((perm) => perm.key) || [];
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role?.name,
      store: result.user.store,
      isMasterAdmin: result.user.isMasterAdmin,
      permissions,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.json({ success: true });
});

module.exports = { login, refresh, logout };
