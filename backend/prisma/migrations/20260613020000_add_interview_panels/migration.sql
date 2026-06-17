-- CreateEnum
CREATE TYPE "InterviewStandard" AS ENUM ('ey', 'mckinsey');

-- CreateEnum
CREATE TYPE "PanelStatus" AS ENUM ('scheduled', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "PanelDecision" AS ENUM ('pending', 'strong_yes', 'yes', 'no', 'strong_no');

-- CreateTable
CREATE TABLE "InterviewPanel" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "stage" "ApplicantStage" NOT NULL,
    "standard" "InterviewStandard" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "PanelStatus" NOT NULL DEFAULT 'scheduled',
    "overallDecision" "PanelDecision" NOT NULL DEFAULT 'pending',
    "hrNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelMember" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decision" "PanelDecision" NOT NULL DEFAULT 'pending',
    "scores" JSONB,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PanelMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewPanel_applicantId_idx" ON "InterviewPanel"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "PanelMember_panelId_userId_key" ON "PanelMember"("panelId", "userId");

-- CreateIndex
CREATE INDEX "PanelMember_userId_idx" ON "PanelMember"("userId");

-- AddForeignKey
ALTER TABLE "InterviewPanel" ADD CONSTRAINT "InterviewPanel_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPanel" ADD CONSTRAINT "InterviewPanel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelMember" ADD CONSTRAINT "PanelMember_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "InterviewPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelMember" ADD CONSTRAINT "PanelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
