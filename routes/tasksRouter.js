const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");

const upload = multer();
const prisma = new PrismaClient();

// Simple auth middleware—replace with your real one if you have it
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
// GET /api/tasks
router.get("/", requireAuth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
      // include: {
      //   quest: true, // Optional: include quest data if you want context in frontend
      // },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            createdAt: true,
            updatedAt: true,
            // omit `data`
          },
        },
      },
    });
    res.json(tasks);
  } catch (err) {
    console.error("Ошибка при получении задач:", err);
    res.status(500).json({ error: "Ошибка при получении задач" });
  }
});

// GET /api/tasks/all
router.get("/all", requireAuth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "asc" },
      // include: {
      //   quest: true, // Optional: include quest data if you want context in frontend
      // },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            createdAt: true,
            updatedAt: true,
            // omit `data`
          },
        },
      },
    });
    res.json(tasks);
  } catch (err) {
    console.error("Ошибка при получении задач:", err);
    res.status(500).json({ error: "Ошибка при получении задач" });
  }
});

// POST /api/tasks
router.post("/", requireAuth, upload.array("files"), async (req, res) => {
  const { questId, title, description, type, value, max, done, completed } =
    req.body;

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
        done,
        value,
        max,
        completed,
        quest: { connect: { id: questId } },
        user: { connect: { id: req.user.id } },
        files: undefined,
      },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            createdAt: true,
            updatedAt: true,
            // omit `data`
          },
        },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error("Ошибка при создании задачи:", err);
    res.status(500).json({ error: "Ошибка при создании задачи" });
  }
});

router.get("/files/:id", async (req, res) => {
  const file = await prisma.file.findUnique({
    where: { id: req.params.id },
  });

  if (!file) return res.status(404).send("File not found");

  const encodedName = encodeURIComponent(file.name);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
  );
  res.setHeader("Content-Type", file.mimeType);
  res.send(file.data);
});

// PUT /api/tasks/:id
router.put("/:id", requireAuth, upload.array("files"), async (req, res) => {
  const { id } = req.params;
  const parsed = JSON.parse(req.body.data);

  const { title, description, done, max, questId, type, value, completed } =
    parsed;
  const files = req.files;

  try {
    const existing = await prisma.task.findFirst({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    // 1. Delete old files
    await prisma.file.deleteMany({
      where: { taskId: id },
    });

    // 2. Update task and attach new files
    const updated = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        type,
        value,
        max,
        done,
        completed,
        files:
          files?.length > 0
            ? {
                create: files.map((file) => ({
                  name: file.originalname,
                  mimeType: file.mimetype,
                  data: file.buffer,
                })),
              }
            : undefined,
      },
      include: {
        files: true,
      },
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
    await prisma.task.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (err) {
    console.error("Ошибка при удалении задачи:", err);
    res.status(500).json({ error: "Ошибка при удалении задачи" });
  }
});

module.exports = router;
