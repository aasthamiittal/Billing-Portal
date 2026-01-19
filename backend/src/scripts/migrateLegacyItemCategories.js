const mongoose = require("mongoose");
const env = require("../config/env");
const Item = require("../models/Item");
const Category = require("../models/Category");
const Store = require("../models/Store");

async function run() {
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });

  // Find items that still have legacy "category" string but no categoryId.
  const items = await Item.find({
    $and: [
      { store: { $type: "objectId" } },
      { $or: [{ categoryId: { $exists: false } }, { categoryId: null }] },
      { category: { $exists: true, $ne: "" } }, // legacy field may still exist in DB
    ],
  })
    .select("store industry category categoryId categoryName")
    .lean()
    .exec();

  if (!items.length) {
    // eslint-disable-next-line no-console
    console.log("No legacy items found. Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  const stores = await Store.find({ _id: { $in: items.map((i) => i.store) } })
    .select("_id industry")
    .lean()
    .exec();
  const storeIndustry = new Map(stores.map((s) => [String(s._id), String(s.industry)]));

  const catCache = new Map(); // key: storeId|name -> categoryDoc

  let createdCats = 0;
  let updatedItems = 0;

  for (const it of items) {
    const storeId = String(it.store);
    const name = String(it.category || "").trim();
    if (!name) continue;

    const key = `${storeId}|${name.toLowerCase()}`;
    let cat = catCache.get(key);
    if (!cat) {
      cat = await Category.findOne({ store: storeId, name }).exec();
      if (!cat) {
        const industryId = storeIndustry.get(storeId);
        if (!industryId) continue;
        cat = await Category.create({
          store: storeId,
          industry: industryId,
          name,
          code: "",
          isActive: true,
        });
        createdCats += 1;
      }
      catCache.set(key, cat);
    }

    await Item.updateOne(
      { _id: it._id },
      { $set: { categoryId: cat._id, categoryName: cat.name } },
      { strict: false }
    ).exec();
    updatedItems += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Migrated legacy categories: created ${createdCats} categories, updated ${updatedItems} items.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("migrateLegacyItemCategories failed", err);
  process.exit(1);
});

