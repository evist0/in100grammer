-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "fullName" TEXT,
    "description" TEXT,
    "followers" INTEGER,
    "following" INTEGER,
    "postsAmount" INTEGER,
    "lastPost" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "potentiallyBusiness" BOOLEAN,
    "business" BOOLEAN,
    "businessCategory" TEXT,
    "countryCode" TEXT,
    "countryReason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "iam" TEXT NOT NULL,
    "busy" BOOLEAN NOT NULL DEFAULT false,
    "dead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("iam")
);
