import { prisma } from "@/lib/prisma";

type AdminLogInput = {
  action: string;
  title: string;
  details?: string;
  adminDiscordId?: string;
  targetType?: string;
  targetId?: string;
  targetMemberId?: string;
};

export async function createAdminLog(input: AdminLogInput) {
  return prisma.adminLog.create({
    data: {
      action: input.action,
      title: input.title,
      details: input.details,
      adminDiscordId: input.adminDiscordId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetMemberId: input.targetMemberId,
    },
  });
}
