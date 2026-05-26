/*
  Warnings:

  - You are about to drop the column `neighbourhood` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `address` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subcounty` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "neighbourhood",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "subcounty" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
