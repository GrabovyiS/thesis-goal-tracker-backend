const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', requireAuth, async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(goals);
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description } = req.body;
  const goal = await prisma.goal.create({
    data: { title, description, userId: req.user.id }
  });
  res.json(goal);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;
  const updated = await prisma.goal.updateMany({
    where: { id, userId: req.user.id },
    data: { title, description }
  });
  res.json({ updated: updated.count > 0 });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await prisma.goal.deleteMany({
    where: { id, userId: req.user.id }
  });
  res.json({ success: true });
});

module.exports = router;