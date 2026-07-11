import express from "express";
import Document from "../models/Document.js";
import Chunk from "../models/Chunk.js";
import Membership from "../models/Membership.js";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { extractTextFromPDF, chunkText } from "../utils/textProcessing.js";
import { generateEmbedding } from "../utils/embeddings.js";

const router = express.Router();

// POST /api/documents/:workspaceId — upload a document to a workspace
router.post(
  "/:workspaceId",
  protect,
  upload.single("file"),
  async (req, res) => {
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

      const document = await Document.create({
        workspace: workspaceId,
        uploadedBy: req.userId,
        originalName: req.file.originalname,
        storedFileName: req.file.filename,
        fileSize: req.file.size,
      });

      const text = await extractTextFromPDF(req.file.path);
      const chunks = chunkText(text);

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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;