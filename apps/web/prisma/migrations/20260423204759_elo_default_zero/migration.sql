-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "elo" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "bestChain" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarUrl", "bestChain", "createdAt", "elo", "gamesPlayed", "gamesWon", "id", "nickname", "passwordHash") SELECT "avatarUrl", "bestChain", "createdAt", "elo", "gamesPlayed", "gamesWon", "id", "nickname", "passwordHash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
