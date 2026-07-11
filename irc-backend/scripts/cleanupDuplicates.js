import mongoose from "mongoose";
import dotenv from "dotenv";
import Document from "../models/Document.js";
import Chunk from "../models/Chunk.js";

dotenv.config();

const cleanup = async () => {
  await mongoose.connect("mongodb://localhost:27017/coreference");
  console.log("Connected to MongoDB");

  const allDocs = await Document.find({}).sort({ createdAt: 1 });

  const seen = new Map();
  const toDelete = [];

  for (const doc of allDocs) {
    const key = `${doc.workspace}-${doc.originalName}`;
    if (seen.has(key)) {
      toDelete.push(doc._id);
    } else {
      seen.set(key, doc._id);
    }
  }

  console.log(`Found ${toDelete.length} duplicate documents to delete.`);

  for (const docId of toDelete) {
    const chunkResult = await Chunk.deleteMany({ document: docId });
    await Document.findByIdAndDelete(docId);
    console.log(`Deleted document ${docId} and ${chunkResult.deletedCount} chunks.`);
  }

  console.log("Cleanup complete.");
  await mongoose.disconnect();
};

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});