const express = require("express");
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const { loginSchema, refreshSchema } = require("../validators/authValidators");

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(refreshSchema), authController.logout);

module.exports = router;
