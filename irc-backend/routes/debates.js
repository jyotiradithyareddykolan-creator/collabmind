import express from "express";
import Debate from "../models/Debate.js";
import DebateComment from "../models/DebateComment.js";
import Membership from "../models/Membership.js";
import Chunk from "../models/Chunk.js";
import protect from "../middleware/auth.js";
import { generateEmbedding, generateText } from "../utils/embeddings.js";
import { cosineSimilarity } from "../utils/similarity.js";

const router = express.Router();

// Shared helper: same retrieval pattern as /api/workspaces/:id/ask
async function getTopChunks(workspaceId, query, limit = 4) {
  const queryEmbedding = await generateEmbedding(query);
  const allChunks = await Chunk.find({ workspace: workspaceId }).populate("document");

  if (allChunks.length === 0) return [];

  const scored = allChunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.chunk);
}

function chunksToContextBlock(chunks) {
  return chunks.map((c) => c.text).join("\n\n---\n\n");
}

async function requireActiveMembership(userId, workspaceId) {
  return Membership.findOne({ user: userId, workspace: workspaceId, status: "active" });
}

// ---------- Core CRUD ----------

// POST /api/debates/:workspaceId — create a debate topic
router.post("/:workspaceId", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description } = req.body;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const debate = await Debate.create({
      workspace: workspaceId,
      title: title.trim(),
      description: description || "",
      createdBy: req.userId,
    });

    res.status(201).json(debate);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/debates/:workspaceId — list debates for a workspace
router.get("/:workspaceId", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const debates = await Debate.find({ workspace: workspaceId }).sort({ createdAt: -1 });
    res.json(debates);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/debates/:workspaceId/:debateId — get one debate + its comments
router.get("/:workspaceId/:debateId", protect, async (req, res) => {
  try {
    const { workspaceId, debateId } = req.params;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const debate = await Debate.findOne({ _id: debateId, workspace: workspaceId });
    if (!debate) {
      return res.status(404).json({ message: "Debate not found" });
    }

    const comments = await DebateComment.find({ debate: debateId })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    const commentsWithMeta = comments.map((c) => ({
      ...c.toObject(),
      upvoteCount: c.upvotes.length,
      upvotedByMe: c.upvotes.some((u) => u.toString() === req.userId),
    }));

    res.json({ debate, comments: commentsWithMeta });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------- Comments ----------

// POST /api/debates/:workspaceId/:debateId/comments — add a human comment
router.post("/:workspaceId/:debateId/comments", protect, async (req, res) => {
  try {
    const { workspaceId, debateId } = req.params;
    const { stance, content } = req.body;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    if (!["for", "against", "neutral"].includes(stance)) {
      return res.status(400).json({ message: "Invalid stance" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const debate = await Debate.findOne({ _id: debateId, workspace: workspaceId });
    if (!debate) {
      return res.status(404).json({ message: "Debate not found" });
    }
    if (debate.status === "closed") {
      return res.status(400).json({ message: "This debate is closed" });
    }

    const comment = await DebateComment.create({
      debate: debateId,
      author: req.userId,
      stance,
      content: content.trim(),
    });

    const populated = await comment.populate("author", "name email");
    res.status(201).json({ ...populated.toObject(), upvoteCount: 0, upvotedByMe: false });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/debates/:workspaceId/:debateId/comments/:commentId/upvote — toggle upvote
router.post("/:workspaceId/:debateId/comments/:commentId/upvote", protect, async (req, res) => {
  try {
    const { workspaceId, commentId } = req.params;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const comment = await DebateComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyUpvoted = comment.upvotes.some((u) => u.toString() === req.userId);

    if (alreadyUpvoted) {
      comment.upvotes = comment.upvotes.filter((u) => u.toString() !== req.userId);
    } else {
      comment.upvotes.push(req.userId);
    }

    await comment.save();

    res.json({
      commentId: comment._id,
      upvoteCount: comment.upvotes.length,
      upvotedByMe: !alreadyUpvoted,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------- AI assistance ----------

// POST /api/debates/:workspaceId/:debateId/ai/counter
// Generates a counter-argument to a specific comment
router.post("/:workspaceId/:debateId/ai/counter", protect, async (req, res) => {
  try {
    const { workspaceId, debateId } = req.params;
    const { commentId, useRag } = req.body;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const debate = await Debate.findOne({ _id: debateId, workspace: workspaceId });
    if (!debate) {
      return res.status(404).json({ message: "Debate not found" });
    }

    const targetComment = await DebateComment.findOne({ _id: commentId, debate: debateId });
    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    let contextBlock = "";
    if (useRag) {
      const chunks = await getTopChunks(workspaceId, `${debate.title} ${targetComment.content}`);
      contextBlock = chunks.length
        ? `\n\nRelevant document context you may cite:\n${chunksToContextBlock(chunks)}`
        : "";
    }

    const opposingStance = targetComment.stance === "for" ? "against" : "for";

    const prompt = `You are participating in a structured debate as a critical thinker.

Debate topic: "${debate.title}"
${debate.description ? `Context: ${debate.description}` : ""}

The comment you are responding to (stance: ${targetComment.stance}):
"${targetComment.content}"
${contextBlock}

Write a concise, well-reasoned counter-argument (stance: ${opposingStance}) that directly challenges the specific points made above. Do not just restate the opposite position — engage with the actual reasoning given. Keep it under 150 words.`;

    const aiText = await generateText(prompt);

    const comment = await DebateComment.create({
      debate: debateId,
      author: null,
      isAI: true,
      aiType: "counter",
      groundedInDocs: !!useRag,
      stance: opposingStance,
      content: aiText,
    });

    res.status(201).json({ ...comment.toObject(), upvoteCount: 0, upvotedByMe: false });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/debates/:workspaceId/:debateId/ai/summarize
// Summarizes the debate so far, both sides
router.post("/:workspaceId/:debateId/ai/summarize", protect, async (req, res) => {
  try {
    const { workspaceId, debateId } = req.params;
    const { useRag } = req.body;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const debate = await Debate.findOne({ _id: debateId, workspace: workspaceId });
    if (!debate) {
      return res.status(404).json({ message: "Debate not found" });
    }

    const comments = await DebateComment.find({ debate: debateId })
      .populate("author", "name")
      .sort({ createdAt: 1 });

    if (comments.length === 0) {
      return res.json({ summary: "No comments yet in this debate." });
    }

    const transcript = comments
      .map((c) => `[${c.stance.toUpperCase()}] ${c.isAI ? "AI" : c.author?.name || "User"}: ${c.content}`)
      .join("\n\n");

    let contextBlock = "";
    if (useRag) {
      const chunks = await getTopChunks(workspaceId, debate.title);
      contextBlock = chunks.length
        ? `\n\nRelevant document context:\n${chunksToContextBlock(chunks)}`
        : "";
    }

    const prompt = `Summarize the following debate fairly and neutrally.

Debate topic: "${debate.title}"
${debate.description ? `Context: ${debate.description}` : ""}
${contextBlock}

Transcript:
${transcript}

Provide:
1. A short summary of the "for" side's strongest points
2. A short summary of the "against" side's strongest points
3. Any points of agreement or unresolved tension
Keep the whole thing under 200 words.`;

    const summary = await generateText(prompt);
    res.json({ summary, groundedInDocs: !!useRag });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/debates/:workspaceId/:debateId/ai/participant
// AI posts its own comment taking a stance
router.post("/:workspaceId/:debateId/ai/participant", protect, async (req, res) => {
  try {
    const { workspaceId, debateId } = req.params;
    const { stance, useRag } = req.body;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    if (!["for", "against"].includes(stance)) {
      return res.status(400).json({ message: "Stance must be 'for' or 'against'" });
    }

    const debate = await Debate.findOne({ _id: debateId, workspace: workspaceId });
    if (!debate) {
      return res.status(404).json({ message: "Debate not found" });
    }

    const existingComments = await DebateComment.find({ debate: debateId }).sort({ createdAt: 1 });
    const priorPoints = existingComments.length
      ? existingComments.map((c) => `[${c.stance}] ${c.content}`).join("\n")
      : "(No prior comments — you're opening this side of the debate.)";

    let contextBlock = "";
    if (useRag) {
      const chunks = await getTopChunks(workspaceId, debate.title);
      contextBlock = chunks.length
        ? `\n\nRelevant document context you may cite:\n${chunksToContextBlock(chunks)}`
        : "";
    }

    const prompt = `You are an AI participant in a structured debate, arguing in good faith for the "${stance}" position.

Debate topic: "${debate.title}"
${debate.description ? `Context: ${debate.description}` : ""}
${contextBlock}

Prior discussion:
${priorPoints}

Write a persuasive, well-reasoned argument for the "${stance}" position. Build on or respond to prior points where relevant, don't just repeat what's already been said. Keep it under 150 words.`;

    const aiText = await generateText(prompt);

    const comment = await DebateComment.create({
      debate: debateId,
      author: null,
      isAI: true,
      aiType: "participant",
      groundedInDocs: !!useRag,
      stance,
      content: aiText,
    });

    res.status(201).json({ ...comment.toObject(), upvoteCount: 0, upvotedByMe: false });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/debates/:workspaceId/ai/suggest-topics
// Suggests debate topics before one is created — workspace-level, not tied to a debate
router.post("/:workspaceId/ai/suggest-topics", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { useRag, seedIdea } = req.body;

    const membership = await requireActiveMembership(req.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    let contextBlock = "";
    if (useRag) {
      const chunks = await getTopChunks(workspaceId, seedIdea || "key debatable claims and open questions");
      contextBlock = chunks.length
        ? `\n\nRelevant document context:\n${chunksToContextBlock(chunks)}`
        : "";
    }

    const prompt = `Suggest 4 debate topics suitable for a research team workspace.
${seedIdea ? `The user has this rough idea in mind: "${seedIdea}"` : ""}
${contextBlock}

Each topic should be a single, debatable claim (not a vague theme) that reasonably has a "for" and "against" side. Return ONLY a JSON array of strings, nothing else, no markdown formatting, e.g.:
["Claim one...", "Claim two...", "Claim three...", "Claim four..."]`;

    const raw = await generateText(prompt);
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let topics;
    try {
      topics = JSON.parse(cleaned);
    } catch {
      topics = [cleaned]; // fallback: return raw text as a single suggestion
    }

    res.json({ topics, groundedInDocs: !!useRag });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;