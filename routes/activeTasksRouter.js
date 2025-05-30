const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/", requireAuth, async (req, res) => {
  const activeTasks = await prisma.activeTask.findMany({
    where: { userId: req.user.id },
    orderBy: { position: "asc" },
    include: { task: true },
  });
  res.json(activeTasks);
});

router.post("/", requireAuth, async (req, res) => {
  const { taskId } = req.body;

  // Проверим, нет ли уже такой активной задачи
  const existing = await prisma.activeTask.findFirst({
    where: { taskId, userId: req.user.id },
  });
  if (existing) return res.json(existing);

  // Найдём текущую максимальную позицию
  const max = await prisma.activeTask.aggregate({
    where: { userId: req.user.id },
    _max: { position: true },
  });

  const newTask = await prisma.activeTask.create({
    data: {
      userId: req.user.id,
      taskId,
      position: (max._max.position || 0) + 1,
    },
    include: { task: true },
  });

  res.json(newTask);
});

router.put("/reorder", requireAuth, async (req, res) => {
  const { orderedTaskIds } = req.body;
  const updates = await Promise.all(
    orderedTaskIds.map((taskId, index) =>
      prisma.activeTask.updateMany({
        where: { taskId, userId: req.user.id },
        data: { position: index + 1 },
      })
    )
  );
  res.json({ success: true });
});

router.delete("/:taskId", requireAuth, async (req, res) => {
  const { taskId } = req.params;
  await prisma.activeTask.deleteMany({
    where: { taskId, userId: req.user.id },
  });
  res.json({ success: true });
});

module.exports = router;
