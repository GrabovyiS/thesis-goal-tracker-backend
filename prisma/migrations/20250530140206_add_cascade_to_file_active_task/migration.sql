-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActiveTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "ActiveTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActiveTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActiveTask" ("id", "position", "taskId", "userId") SELECT "id", "position", "taskId", "userId" FROM "ActiveTask";
DROP TABLE "ActiveTask";
ALTER TABLE "new_ActiveTask" RENAME TO "ActiveTask";
CREATE UNIQUE INDEX "ActiveTask_taskId_key" ON "ActiveTask"("taskId");
CREATE TABLE "new_File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "File_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_File" ("createdAt", "data", "id", "mimeType", "name", "taskId", "updatedAt") SELECT "createdAt", "data", "id", "mimeType", "name", "taskId", "updatedAt" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
