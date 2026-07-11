import express from "express";
import PDFDocument from "pdfkit";
import Note from "../models/Note.js";
import Membership from "../models/Membership.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// Helper: can this user currently edit the note?
async function canEdit(note, userId, membership) {
  if (membership.role === "admin") return true; // owner always can

  if (!note) return true; // no note yet, default permission is "all" — anyone can create it

  switch (note.editPermission) {
    case "all":
      return true;
    case "owner_only":
      return false;
    case "selected":
      return note.allowedEditors.some(
        (editorId) => editorId.toString() === userId.toString()
      );
    default:
      return true;
  }
}

// GET /api/notes/:workspaceId — get the shared note for a workspace
router.get("/:workspaceId", protect, async (req, res) => {
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

    let note = await Note.findOne({ workspace: workspaceId });
    if (!note) {
      note = {
        content: "",
        updatedBy: null,
        editPermission: "all",
        allowedEditors: [],
      };
    }

    const editable = await canEdit(note, req.userId, membership);

    res.json({ ...note.toObject?.() ?? note, canEdit: editable, isOwner: membership.role === "admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/notes/:workspaceId — create or update note content
router.put("/:workspaceId", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { content } = req.body;

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

    const existingNote = await Note.findOne({ workspace: workspaceId });
    const editable = await canEdit(existingNote, req.userId, membership);

    if (!editable) {
      return res
        .status(403)
        .json({ message: "You don't have permission to edit these notes" });
    }

    const note = await Note.findOneAndUpdate(
      { workspace: workspaceId },
      { content, updatedBy: req.userId },
      { new: true, upsert: true }
    );

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/notes/:workspaceId/permissions — owner only, controls who can edit
router.put("/:workspaceId/permissions", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { editPermission, allowedEditors } = req.body;

    const membership = await Membership.findOne({
      user: req.userId,
      workspace: workspaceId,
      status: "active",
    });

    if (!membership || membership.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only the workspace owner can change note permissions" });
    }

    if (!["all", "selected", "owner_only"].includes(editPermission)) {
      return res.status(400).json({ message: "Invalid permission value" });
    }

    const note = await Note.findOneAndUpdate(
      { workspace: workspaceId },
      {
        editPermission,
        allowedEditors: editPermission === "selected" ? allowedEditors || [] : [],
      },
      { new: true, upsert: true }
    );

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/notes/:workspaceId/pdf — export note as a PDF
router.get("/:workspaceId/pdf", protect, async (req, res) => {
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

    const note = await Note.findOne({ workspace: workspaceId });
    const content = note?.content || "";

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="workspace-notes-${workspaceId}.pdf"`
    );

    doc.pipe(res);

    doc
      .fontSize(18)
      .text("Workspace Notes", { underline: true })
      .moveDown();

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Exported ${new Date().toLocaleString()}`)
      .moveDown(1.5);

    doc
      .fontSize(12)
      .fillColor("black")
      .text(content || "(No notes yet)", {
        align: "left",
        lineGap: 4,
      });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;