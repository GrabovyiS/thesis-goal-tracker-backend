const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Получить задачи по questId через query-параметр
router.get("/", async (req, res) => {
  const { questId } = req.query;
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

// Создать задачу
router.post("/", async (req, res) => {
  try {
    const task = await prisma.task.create({
      data: req.body,
    });
    res.json(task);
  } catch (err) {
    console.error("Ошибка при создании задачи:", err);
    res.status(500).json({ error: "Ошибка при создании задачи" });
  }
});

// Обновить задачу
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.task.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    console.error("Ошибка при обновлении задачи:", err);
    res.status(500).json({ error: "Ошибка при обновлении задачи" });
  }
});

// Удалить задачу с каскадным удалением активных задач
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.activeTask.deleteMany({
      where: { taskId: id },
    });

    const deletedTask = await prisma.task.delete({
      where: { id },
    });

    res.json(deletedTask);
  } catch (err) {
    console.error("Ошибка при удалении задачи:", err);
    res.status(500).json({ error: "Ошибка при удалении задачи" });
  }
});

module.exports = router;
