const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const permissionSchemaController = require("../controllers/permissionSchemaController");

const router = express.Router();

// Permission schema is the global framework, but role managers need to READ it to delegate locally.
// Editing the schema remains a master-only concern (no public schema-write endpoints).
router.get("/", requireAuth, checkPermission("users", "role", "read_only"), permissionSchemaController.listPermissionSchema);

module.exports = router;

