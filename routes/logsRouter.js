const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.post("/", requireAuth, async (req, res) => {
  const { title, description, questId } = req.body;
  if (!title || !questId) {
    return res.status(400).json({ error: "Title and questId are required" });
  }

  try {
    const log = await prisma.log.create({
      data: {
        title,
        description,
        quest: { connect: { id: questId } },
        user: { connect: { id: req.user.id } },
      },
    });
    res.status(201).json(log);
  } catch (err) {
    console.error("Error creating log:", err);
    res.status(500).json({ error: "Failed to create log" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, questId } = req.body;

  try {
    const updatedLog = await prisma.log.update({
      where: { id },
      data: { title, description, questId },
    });
    res.json(updatedLog);
  } catch (err) {
    console.error("Error updating log:", err);
    res.status(500).json({ error: "Failed to update log" });
  }
});

// Delete a log by id
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.log.delete({ where: { id } });
    res.json({ message: "Log deleted" });
  } catch (err) {
    console.error("Error deleting log:", err);
    res.status(500).json({ error: "Failed to delete log" });
  }
});

module.exports = router;
