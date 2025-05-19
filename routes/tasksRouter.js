const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Simple auth middleware—replace with your real one if you have it
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// GET /api/tasks?questId=...
router.get("/", requireAuth, async (req, res) => {
  const { questId } = req.query;
  if (!questId) {
    return res.status(400).json({ error: "Missing questId" });
  }
  try {
    const tasks = await prisma.task.findMany({
      where: { questId },
      orderBy: { createdAt: "asc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error("Ошибка при получении задач:", err);
    res.status(500).json({ error: "Ошибка при получении задач" });
  }
});

// POST /api/tasks
router.post("/", requireAuth, async (req, res) => {
  const { questId, title, description, type, value, max } = req.body;

  // Basic validation
  if (!questId || !title || !type) {
    return res
      .status(400)
      .json({ error: "Required fields: questId, title, type" });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        type,
        value,
        max,
        // Properly connect relations instead of using scalar fields
        quest: { connect: { id: questId } },
        user: { connect: { id: req.user.id } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error("Ошибка при создании задачи:", err);
    res.status(500).json({ error: "Ошибка при создании задачи" });
  }
});

// PUT /api/tasks/:id
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, type, value, max, done } = req.body;

  try {
    const existing = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }
    const updated = await prisma.task.update({
      where: { id },
      data: { title, description, type, value, max, done },
    });
    res.json(updated);
  } catch (err) {
    console.error("Ошибка при обновлении задачи:", err);
    res.status(500).json({ error: "Ошибка при обновлении задачи" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.task.deleteMany({
      where: { id, userId: req.user.id },
    });
    res.status(204).end();
  } catch (err) {
    console.error("Ошибка при удалении задачи:", err);
    res.status(500).json({ error: "Ошибка при удалении задачи" });
  }
});

module.exports = router;
