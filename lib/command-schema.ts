import "server-only";

import { prisma } from "@/lib/prisma";

let commandSchemaPromise: Promise<void> | null = null;

async function applyCommandSchema() {
  const statements = [
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewAssignedTo" TEXT`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewAttendance" TEXT`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewScore" INTEGER`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewEvaluation" TEXT`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "interviewCompletedAt" TIMESTAMP(3)`,
    `ALTER TABLE "TokyoMember" ADD COLUMN IF NOT EXISTS "loyaltyScore" INTEGER NOT NULL DEFAULT 100`,
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
  ];

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

export function ensureCommandSchema() {
  commandSchemaPromise ??= applyCommandSchema().catch((error) => {
    commandSchemaPromise = null;
    throw error;
  });
  return commandSchemaPromise;
}
