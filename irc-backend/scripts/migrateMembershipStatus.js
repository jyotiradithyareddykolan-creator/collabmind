import mongoose from "mongoose";
import Membership from "../models/Membership.js";

const migrate = async () => {
  await mongoose.connect("mongodb://localhost:27017/coreference");
  console.log("Connected to MongoDB");

  const result = await Membership.updateMany(
    { status: { $exists: false } },
    { $set: { status: "active" } }
  );

  console.log(`Updated ${result.modifiedCount} membership(s) to status: active`);

  await mongoose.disconnect();
};

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});