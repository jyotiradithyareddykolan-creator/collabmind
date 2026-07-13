import express from "express";
import Document from "../models/Document.js";
import Chunk from "../models/Chunk.js";
import Membership from "../models/Membership.js";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import cloudinary, { configureCloudinary } from "../config/cloudinary.js";
import { extractTextFromPDF, chunkText } from "../utils/textProcessing.js";
import { generateEmbedding } from "../utils/embeddings.js";

const router = express.Router();

// Helper: upload a buffer to Cloudinary, returns the result (with secure_url etc.)
function uploadBufferToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // PDFs aren't images, so use "raw"
        folder: "collabmind-documents",
        public_id: `${Date.now()}-${originalName.replace(/\.pdf$/i, "")}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// POST /api/documents/:workspaceId — upload a document to a workspace
router.post(
  "/:workspaceId",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      configureCloudinary();

      const { workspaceId } = req.params;

      const membership = await Membership.findOne({
        user: req.userId,
        workspace: workspaceId,
      });

      if (!membership) {
        return res
          .status(403)
          .json({ message: "You are not a member of this workspace" });
      }

      // Extract text directly from the in-memory buffer (before uploading anywhere)
      const text = await extractTextFromPDF(req.file.buffer);
      const chunks = chunkText(text);

      // Upload the same buffer to Cloudinary for permanent storage
      const cloudinaryResult = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      const document = await Document.create({
        workspace: workspaceId,
        uploadedBy: req.userId,
        originalName: req.file.originalname,
        storedFileName: cloudinaryResult.secure_url, // now a full Cloudinary URL
        fileSize: req.file.size,
      });

      const chunkDocs = [];
      for (let index = 0; index < chunks.length; index++) {
        const embedding = await generateEmbedding(chunks[index]);
        chunkDocs.push({
          document: document._id,
          workspace: workspaceId,
          text: chunks[index],
          chunkIndex: index,
          embedding,
        });
      }

      await Chunk.insertMany(chunkDocs);

      res.status(201).json({
        document,
        chunksCreated: chunkDocs.length,
      });
    } catch (err) {
      console.error("Document upload error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// GET /api/documents/:workspaceId — list documents in a workspace
router.get("/:workspaceId", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership = await Membership.findOne({
      user: req.userId,
      workspace: workspaceId,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    const documents = await Document.find({ workspace: workspaceId });
    res.json(documents);
  } catch (err) {
    console.error("Document list error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;