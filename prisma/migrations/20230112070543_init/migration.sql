-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT,
    "description" TEXT,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "postsAmount" INTEGER NOT NULL,
    "lastPost" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "potentiallyBusiness" BOOLEAN NOT NULL,
    "business" BOOLEAN NOT NULL,
    "businessCategory" TEXT,
    "countryCode" TEXT,
    "countryReason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "busy" BOOLEAN NOT NULL,
    "dead" BOOLEAN NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "host" TEXT NOT NULL,
    "port" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "busy" BOOLEAN NOT NULL,
    "dead" BOOLEAN NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("host")
);
