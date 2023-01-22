/*
  Warnings:

  - Added the required column `dead` to the `Accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dead` to the `Proxy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Accounts" ADD COLUMN     "dead" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Proxy" ADD COLUMN     "dead" BOOLEAN NOT NULL;
