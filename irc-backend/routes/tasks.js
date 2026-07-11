import express from "express";
import Task from "../models/Task.js";
import Membership from "../models/Membership.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// POST /api/tasks/:workspaceId — create a task in a workspace
router.post("/:workspaceId", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title } = req.body;

    const membership = await Membership.findOne({
      user: req.userId,
      workspace: workspaceId,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    const task = await Task.create({
      workspace: workspaceId,
      createdBy: req.userId,
      title,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/tasks/:workspaceId — list tasks in a workspace
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

    const tasks = await Task.find({ workspace: workspaceId }).sort({
      createdAt: -1,
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH /api/tasks/:taskId — edit a task's title and/or status
router.patch("/:taskId", protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const membership = await Membership.findOne({
      user: req.userId,
      workspace: task.workspace,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    if (title !== undefined) task.title = title;
    if (status !== undefined) task.status = status;
    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/tasks/:taskId — delete a task
router.delete("/:taskId", protect, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const membership = await Membership.findOne({
      user: req.userId,
      workspace: task.workspace,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;