-- Per-user progress (checklist completion + notes) against a mentorship guide
CREATE TABLE "GuideProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "completedItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuideProgress_userId_guideId_key" ON "GuideProgress"("userId", "guideId");

ALTER TABLE "GuideProgress" ADD CONSTRAINT "GuideProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuideProgress" ADD CONSTRAINT "GuideProgress_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "MentorshipGuide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
