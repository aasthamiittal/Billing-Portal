const express = require("express");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const roleRoutes = require("./roles");
const industryRoutes = require("./industries");
const storeRoutes = require("./stores");
const itemRoutes = require("./items");
const skuRoutes = require("./skus");
const invoiceRoutes = require("./invoices");
const reportRoutes = require("./reports");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/industries", industryRoutes);
router.use("/stores", storeRoutes);
router.use("/items", itemRoutes);
router.use("/skus", skuRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/reports", reportRoutes);

module.exports = router;
