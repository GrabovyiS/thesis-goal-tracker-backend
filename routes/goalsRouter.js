const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/", requireAuth, async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(goals);
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description, completed } = req.body;
  const goal = await prisma.goal.create({
    data: { title, description, completed, userId: req.user.id },
  });
  res.json(goal);
});

router.put("/:id", requireAuth, async (req, res) => {
  const { title, description, completed } = req.body;
  const { id } = req.params;
  const updated = await prisma.goal.update({
    where: { id },
    data: { title, description, completed },
  });
  res.json({ updated: updated });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.goal.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка при удалении цели:", err);
    res.status(500).json({ error: "Ошибка при удалении цели" });
  }
});

module.exports = router;
