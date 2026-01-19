const mongoose = require("mongoose");
const env = require("../config/env");
const CatalogEntry = require("../models/CatalogEntry");

async function run() {
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });

  const res = await CatalogEntry.deleteMany({ kind: "modifier-groups" }).exec();
  // eslint-disable-next-line no-console
  console.log(`Deleted ${res.deletedCount || 0} CatalogEntry rows of kind=modifier-groups`);

  await mongoose.disconnect();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("removeModifierGroups failed", err);
  process.exit(1);
});

