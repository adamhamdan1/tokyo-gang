import "server-only";

import { prisma } from "@/lib/prisma";

export async function awardProgressAchievements(memberId: string, adminId: string) {
  const member = await prisma.tokyoMember.findUnique({ where: { id: memberId }, select: { commandPoints: true } });
  if (!member) return [];
  const completedTasks = await prisma.taskAssignment.count({ where: { memberId, status: "COMPLETED" } });
  const codes = [
    ...(completedTasks >= 1 ? ["FIRST_TASK"] : []),
    ...(member.commandPoints >= 100 ? ["CENTURY"] : []),
    ...(member.commandPoints >= 300 ? ["ELITE"] : []),
  ];
  const achievements = await prisma.achievement.findMany({ where: { code: { in: codes }, active: true } });
  await Promise.all(achievements.map((achievement) => prisma.memberAchievement.upsert({
    where: { memberId_achievementId: { memberId, achievementId: achievement.id } },
    update: {},
    create: { memberId, achievementId: achievement.id, awardedBy: adminId },
  })));
  return achievements;
}
