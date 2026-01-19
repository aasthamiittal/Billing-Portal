const express = require("express");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const roleRoutes = require("./roles");
const permissionSchemaRoutes = require("./permissionSchema");
const catalogRoutes = require("./catalog");
const industryRoutes = require("./industries");
const storeRoutes = require("./stores");
const itemRoutes = require("./items");
const categoryRoutes = require("./categories");
const skuRoutes = require("./skus");
const inventoryRoutes = require("./inventory");
const invoiceRoutes = require("./invoices");
const reportRoutes = require("./reports");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/permission-schema", permissionSchemaRoutes);
router.use("/catalog", catalogRoutes);
router.use("/industries", industryRoutes);
router.use("/stores", storeRoutes);
router.use("/items", itemRoutes);
router.use("/categories", categoryRoutes);
router.use("/skus", skuRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/reports", reportRoutes);

module.exports = router;
