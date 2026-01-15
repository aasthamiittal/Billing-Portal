const app = require("./app");
const { connectDb } = require("./config/db");
const env = require("./config/env");

const start = async () => {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
