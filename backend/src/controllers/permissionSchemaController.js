const asyncHandler = require("../utils/asyncHandler");
const schema = require("../config/permissionSchema");

const listPermissionSchema = asyncHandler(async (req, res) => {
  res.json(schema);
});

module.exports = { listPermissionSchema };

