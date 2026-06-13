-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('staff', 'intern');

-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('active', 'completed', 'converted', 'ended');

-- CreateEnum
CREATE TYPE "ConversionDecision" AS ENUM ('pending', 'recommend_hire', 'extend', 'end_internship');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'staff';

-- CreateTable
CREATE TABLE "Internship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "plannedEndDate" TIMESTAMP(3) NOT NULL,
    "status" "InternshipStatus" NOT NULL DEFAULT 'active',
    "conversionDecision" "ConversionDecision" NOT NULL DEFAULT 'pending',
    "conversionNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Internship_userId_key" ON "Internship"("userId");

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
