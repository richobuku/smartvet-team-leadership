-- CreateEnum
CREATE TYPE "BinderStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "CandidateBinder" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "stage" "ApplicantStage" NOT NULL,
    "status" "BinderStatus" NOT NULL DEFAULT 'pending',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateBinder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderContribution" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "strengths" TEXT,
    "concerns" TEXT,
    "probingQuestions" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateBinder_applicantId_idx" ON "CandidateBinder"("applicantId");

-- CreateIndex
CREATE INDEX "BinderContribution_userId_idx" ON "BinderContribution"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BinderContribution_binderId_userId_key" ON "BinderContribution"("binderId", "userId");

-- AddForeignKey
ALTER TABLE "CandidateBinder" ADD CONSTRAINT "CandidateBinder_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateBinder" ADD CONSTRAINT "CandidateBinder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderContribution" ADD CONSTRAINT "BinderContribution_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "CandidateBinder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderContribution" ADD CONSTRAINT "BinderContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
