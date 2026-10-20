-- CreateTable
CREATE TABLE "SubjectGrade" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "groupCode" TEXT,
    "subjectName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "l1" TEXT,
    "l2" TEXT,
    "t3" TEXT,
    "final10" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectGrade_memberId_subjectCode_key" ON "SubjectGrade"("memberId", "subjectCode");

-- AddForeignKey
ALTER TABLE "SubjectGrade" ADD CONSTRAINT "SubjectGrade_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
