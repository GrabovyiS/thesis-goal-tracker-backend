const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/", requireAuth, async (req, res) => {
  const quests = await prisma.quest.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(quests);
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description, goalId, deadline } = req.body;
  const quest = await prisma.quest.create({
    data: {
      title,
      description,
      user: {
        connect: { id: req.user.id }, // Connect existing user
      },
      goal: {
        connect: { id: goalId }, // Connect existing goal
      },
      deadline: deadline ? new Date(deadline) : undefined,
    },
  });
  res.json(quest);
});

router.put("/:id", requireAuth, async (req, res) => {
  const { title, description, deadline, goalId } = req.body;

  const { id } = req.params;

  const updated = await prisma.quest.update({
    where: { id },
    data: {
      title,
      description,
      deadline: deadline ? new Date(deadline) : null,
      user: {
        connect: { id: req.user.id }, // Connect existing user
      },
      goal: {
        connect: { id: goalId }, // Connect existing goal
      },
    },
  });
  res.json({ updated: updated });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await prisma.quest.deleteMany({
    where: { id, userId: req.user.id },
  });
  res.json({ success: true });
});

module.exports = router;
