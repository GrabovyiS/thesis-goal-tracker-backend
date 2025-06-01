const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Replace with your actual auth middleware
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// GET all rewards for a user
router.get("/", requireAuth, async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(rewards);
  } catch (err) {
    console.error("Error fetching rewards:", err);
    res.status(500).json({ error: "Could not fetch rewards" });
  }
});

// POST / create new reward
router.post("/", requireAuth, async (req, res) => {
  const { emoji, title } = req.body;

  if (!emoji || !title) {
    return res.status(400).json({ error: "Emoji and title are required" });
  }

  try {
    const reward = await prisma.reward.create({
      data: {
        emoji,
        title,
        collected,
        user: { connect: { id: req.user.id } },
      },
    });
    res.status(201).json(reward);
  } catch (err) {
    console.error("Error creating reward:", err);
    res.status(500).json({ error: "Could not create reward" });
  }
});

// PUT /:id — update reward (e.g., mark as collected)
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, emoji, collected } = req.body;

  try {
    const reward = await prisma.reward.update({
      where: { id },
      data: {
        title,
        emoji,
        collected,
      },
    });
    res.json(reward);
  } catch (err) {
    console.error("Error updating reward:", err);
    res.status(500).json({ error: "Could not update reward" });
  }
});

// DELETE /:id
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.reward.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting reward:", err);
    res.status(500).json({ error: "Could not delete reward" });
  }
});

module.exports = router;
