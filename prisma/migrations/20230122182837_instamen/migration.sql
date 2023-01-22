/*
  Warnings:

  - You are about to drop the column `dead` on the `Proxy` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Proxy" DROP COLUMN "dead";

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "Accounts" (
    "iam" TEXT NOT NULL,
    "busy" BOOLEAN NOT NULL,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("iam")
);
