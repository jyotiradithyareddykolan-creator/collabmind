import express from "express";
import Workspace from "../models/Workspace.js";
import Membership from "../models/Membership.js";
import Chunk from "../models/Chunk.js";
import User from "../models/User.js";
import protect from "../middleware/auth.js";
import { generateEmbedding, generateAnswer } from "../utils/embeddings.js";
import { cosineSimilarity } from "../utils/similarity.js";

const router = express.Router();

// POST /api/workspaces  — create a new workspace
router.post("/", protect, async (req, res) => {
  try {
    const { name } = req.body;

    const workspace = await Workspace.create({
      name,
      createdBy: req.userId,
    });

    await Membership.create({
      user: req.userId,
      workspace: workspace._id,
      role: "admin",
      status: "active",
    });

    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/workspaces — list ACTIVE workspaces the logged-in user belongs to
router.get("/", protect, async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.userId,
      status: "active",
    }).populate("workspace");

    const workspaces = memberships.map((m) => ({
      ...m.workspace.toObject(),
      role: m.role,
    }));

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/workspaces/pending — list PENDING invites for the logged-in user
router.get("/pending", protect, async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.userId,
      status: "pending",
    }).populate("workspace");

    const pending = memberships.map((m) => ({
      membershipId: m._id,
      workspaceId: m.workspace._id,
      workspaceName: m.workspace.name,
      role: m.role,
    }));

    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/workspaces/invites/:membershipId/accept — accept a pending invite
router.post("/invites/:membershipId/accept", protect, async (req, res) => {
  try {
    const { membershipId } = req.params;

    const membership = await Membership.findById(membershipId);
    if (!membership || String(membership.user) !== req.userId) {
      return res.status(404).json({ message: "Invite not found" });
    }

    membership.status = "active";
    await membership.save();

    res.json({ message: "Invite accepted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/workspaces/invites/:membershipId/decline — decline a pending invite
router.post("/invites/:membershipId/decline", protect, async (req, res) => {
  try {
    const { membershipId } = req.params;

    const membership = await Membership.findById(membershipId);
    if (!membership || String(membership.user) !== req.userId) {
      return res.status(404).json({ message: "Invite not found" });
    }

    await Membership.findByIdAndDelete(membershipId);

    res.json({ message: "Invite declined" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/workspaces/:workspaceId/invite — invite a user by email (creates a PENDING membership)
router.post("/:workspaceId/invite", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;

    const requesterMembership = await Membership.findOne({
      user: req.userId,
      workspace: workspaceId,
      status: "active",
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only workspace admins can invite members" });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res
        .status(404)
        .json({ message: "No user found with that email" });
    }

    const existingMembership = await Membership.findOne({
      user: userToInvite._id,
      workspace: workspaceId,
    });

    if (existingMembership) {
      return res.status(400).json({
        message:
          existingMembership.status === "pending"
            ? "This user already has a pending invite"
            : "This user is already a member",
      });
    }

    const membership = await Membership.create({
      user: userToInvite._id,
      workspace: workspaceId,
      role: "member",
      status: "pending",
    });

    res.status(201).json(membership);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/workspaces/:workspaceId/members — list ACTIVE members of a workspace
router.get("/:workspaceId/members", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership = await Membership.findOne({
      user: req.userId,
      workspace: workspaceId,
      status: "active",
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    const members = await Membership.find({
      workspace: workspaceId,
      status: "active",
    }).populate("user");

    const result = members.map((m) => ({
      id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/workspaces/:workspaceId/ask — RAG-powered Q&A
router.post("/:workspaceId/ask", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { question } = req.body;

    const membership = await Membership.findOne({
      user: req.userId,
      workspace: workspaceId,
      status: "active",
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    const questionEmbedding = await generateEmbedding(question);

    const allChunks = await Chunk.find({ workspace: workspaceId }).populate(
      "document"
    );

    if (allChunks.length === 0) {
      return res.json({
        answer: "No documents have been uploaded to this workspace yet.",
        sources: [],
      });
    }

    const scoredChunks = allChunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }));

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 4).map((sc) => sc.chunk);

    const answer = await generateAnswer(question, topChunks);

    const sources = topChunks.map((chunk) => ({
      id: chunk._id,
      docName: chunk.document.originalName,
      snippet: chunk.text.slice(0, 200) + "...",
    }));

    res.json({ answer, sources });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;