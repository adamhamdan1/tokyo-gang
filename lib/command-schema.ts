import "server-only";

import { prisma } from "@/lib/prisma";

let commandSchemaPromise: Promise<void> | null = null;

async function applyCommandSchema() {
  const schemaVersion = await prisma.siteSetting.findUnique({ where: { key: "commandSchemaVersion" }, select: { value: true } }).catch(() => null);
  if (schemaVersion?.value === "2") return;

  const statements = [
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewAssignedTo" TEXT`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewAttendance" TEXT`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewScore" INTEGER`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewEvaluation" TEXT`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewCompletedAt" TIMESTAMP(3)`,
    `ALTER TABLE "TokyoMember" ADD COLUMN IF NOT EXISTS "loyaltyScore" INTEGER NOT NULL DEFAULT 100`,
    `ALTER TABLE "TokyoMember" ADD COLUMN IF NOT EXISTS "commandPoints" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "TokyoMember" ADD COLUMN IF NOT EXISTS "activityScore" INTEGER NOT NULL DEFAULT 50`,
    `ALTER TABLE "TokyoMember" ADD COLUMN IF NOT EXISTS "securityClearance" TEXT NOT NULL DEFAULT 'STANDARD'`,
    `ALTER TABLE "TokyoMember" ADD COLUMN IF NOT EXISTS "intelligenceTags" TEXT`,
    `ALTER TABLE "TokyoMember" ADD COLUMN IF NOT EXISTS "lastReviewedAt" TIMESTAMP(3)`,
    `CREATE TABLE IF NOT EXISTS "Operation" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'MISSION',
      "objective" TEXT NOT NULL,
      "location" TEXT,
      "startsAt" TIMESTAMP(3) NOT NULL,
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "status" TEXT NOT NULL DEFAULT 'PLANNED',
      "briefing" TEXT,
      "outcome" TEXT,
      "commanderId" TEXT,
      "createdBy" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Operation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Operation_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "TokyoMember"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Operation_code_key" ON "Operation"("code")`,
    `CREATE TABLE IF NOT EXISTS "OperationParticipant" (
      "id" TEXT NOT NULL,
      "operationId" TEXT NOT NULL,
      "memberId" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'UNIT',
      "status" TEXT NOT NULL DEFAULT 'INVITED',
      "note" TEXT,
      "checkedInAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OperationParticipant_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "OperationParticipant_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "OperationParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TokyoMember"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "OperationParticipant_operationId_memberId_key" ON "OperationParticipant"("operationId", "memberId")`,
    `CREATE INDEX IF NOT EXISTS "OperationParticipant_memberId_idx" ON "OperationParticipant"("memberId")`,
    `CREATE INDEX IF NOT EXISTS "OperationParticipant_operationId_idx" ON "OperationParticipant"("operationId")`,
    `CREATE TABLE IF NOT EXISTS "MemberTask" (
      "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'GENERAL', "points" INTEGER NOT NULL DEFAULT 10,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE', "dueAt" TIMESTAMP(3), "createdBy" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "MemberTask_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "TaskAssignment" (
      "id" TEXT NOT NULL, "taskId" TEXT NOT NULL, "memberId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ASSIGNED', "evidence" TEXT, "adminNote" TEXT,
      "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MemberTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "TaskAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TokyoMember"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TaskAssignment_taskId_memberId_key" ON "TaskAssignment"("taskId", "memberId")`,
    `CREATE INDEX IF NOT EXISTS "TaskAssignment_memberId_idx" ON "TaskAssignment"("memberId")`,
    `CREATE TABLE IF NOT EXISTS "Achievement" (
      "id" TEXT NOT NULL, "code" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
      "icon" TEXT NOT NULL DEFAULT '★', "points" INTEGER NOT NULL DEFAULT 0,
      "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_code_key" ON "Achievement"("code")`,
    `CREATE TABLE IF NOT EXISTS "MemberAchievement" (
      "id" TEXT NOT NULL, "memberId" TEXT NOT NULL, "achievementId" TEXT NOT NULL,
      "awardedBy" TEXT NOT NULL, "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MemberAchievement_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "MemberAchievement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TokyoMember"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MemberAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "MemberAchievement_memberId_achievementId_key" ON "MemberAchievement"("memberId", "achievementId")`,
    `CREATE TABLE IF NOT EXISTS "TokyoSeason" (
      "id" TEXT NOT NULL, "name" TEXT NOT NULL, "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT true, "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TokyoSeason_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "StreamerMetric" (
      "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "streamerName" TEXT NOT NULL, "date" TEXT NOT NULL,
      "maxViewers" INTEGER NOT NULL DEFAULT 0, "liveMinutes" INTEGER NOT NULL DEFAULT 0,
      "streamCount" INTEGER NOT NULL DEFAULT 0, "wasLive" BOOLEAN NOT NULL DEFAULT false,
      "lastLiveAt" TIMESTAMP(3), "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "StreamerMetric_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "StreamerMetric_slug_date_key" ON "StreamerMetric"("slug", "date")`,
    `CREATE INDEX IF NOT EXISTS "StreamerMetric_slug_idx" ON "StreamerMetric"("slug")`,
    `INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "points") VALUES
      ('achievement-first-task', 'FIRST_TASK', 'أول إنجاز', 'أكمل أول مهمة داخل TOKYO', '◆', 25),
      ('achievement-century', 'CENTURY', 'قوة المئة', 'وصل إلى 100 نقطة قيادة', '★', 100),
      ('achievement-elite', 'ELITE', 'نخبة TOKYO', 'وصل إلى 300 نقطة قيادة', '♛', 300)
      ON CONFLICT ("code") DO NOTHING`,
  ];

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  await prisma.siteSetting.upsert({
    where: { key: "commandSchemaVersion" },
    update: { value: "2", updatedBy: "SYSTEM_SCHEMA" },
    create: { key: "commandSchemaVersion", value: "2", updatedBy: "SYSTEM_SCHEMA" },
  });
}

export function ensureCommandSchema() {
  commandSchemaPromise ??= applyCommandSchema().catch((error) => {
    commandSchemaPromise = null;
    throw error;
  });
  return commandSchemaPromise;
}
