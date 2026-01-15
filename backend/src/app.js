const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimiter = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/errorHandler");
const env = require("./config/env");
const routes = require("./routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(rateLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", routes);

app.use(errorHandler);

module.exports = app;
