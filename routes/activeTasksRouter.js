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

router.put("/", async (req, res) => {
  const userId = req.user.id;
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds)) {
    return res.status(400).json({ error: "taskIds must be an array" });
  }

  try {
    // Step 1: Delete all previous active tasks for this user
    await prisma.activeTask.deleteMany({
      where: { userId },
    });

    // Step 2: Get only valid task IDs from the database
    const existingTasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true },
    });
    const existingTaskIds = existingTasks.map((t) => t.id);

    // Optional: Warn if some task IDs were not found
    const missingTaskIds = taskIds.filter(
      (id) => !existingTaskIds.includes(id)
    );
    if (missingTaskIds.length > 0) {
      console.warn("Some taskIds were not found in DB:", missingTaskIds);
    }

    // Step 3: Create active tasks in the given order, but only for valid tasks
    for (const [index, taskId] of taskIds.entries()) {
      if (!existingTaskIds.includes(taskId)) continue;

      console.log("creating a new entry");

      await prisma.activeTask.create({
        data: {
          userId,
          taskId,
          position: index,
        },
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to update active tasks:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:taskId", requireAuth, async (req, res) => {
  const { taskId } = req.params;
  await prisma.activeTask.deleteMany({
    where: { taskId, userId: req.user.id },
  });
  res.json({ success: true });
});

module.exports = router;
