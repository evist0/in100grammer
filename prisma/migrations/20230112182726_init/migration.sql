-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "followers" DROP NOT NULL,
ALTER COLUMN "following" DROP NOT NULL,
ALTER COLUMN "postsAmount" DROP NOT NULL,
ALTER COLUMN "potentiallyBusiness" DROP NOT NULL,
ALTER COLUMN "business" DROP NOT NULL;
