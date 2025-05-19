-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" INTEGER,
    "max" INTEGER,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "questId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Task_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "description", "done", "id", "max", "questId", "title", "type", "updatedAt", "userId", "value") SELECT "createdAt", "description", "done", "id", "max", "questId", "title", "type", "updatedAt", "userId", "value" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
