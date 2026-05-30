type Countable = {
  length: number;
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type MemberRiskInput = {
  status: string;
  behaviorScore: number;
  warnings: Array<{ severity: string }>;
  summons: Countable;
  complaintsAgainst: Countable;
  blacklistEntries?: Countable;
};

export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  meta: string;
  createdAt: Date;
  tone: "cyan" | "yellow" | "red" | "green" | "gray";
};

export function calculateMemberRisk(member: MemberRiskInput) {
  const strongWarnings = member.warnings.filter((warning) => warning.severity === "HIGH" || warning.severity === "DISMISSAL").length;
  const normalWarnings = member.warnings.filter((warning) => warning.severity === "NORMAL").length;
  const scorePenalty = Math.max(0, 100 - member.behaviorScore);
  let score = scorePenalty + normalWarnings * 12 + strongWarnings * 28 + member.summons.length * 8 + member.complaintsAgainst.length * 10;

  if (member.status === "BLACKLISTED" || member.status === "DISMISSED") score += 60;
  if (member.status === "HIGH_RISK" || member.status === "FINAL_WARNING") score += 35;
  if ((member.blacklistEntries?.length ?? 0) > 0) score += 45;

  const cappedScore = Math.min(100, score);
  const level: RiskLevel = cappedScore >= 80 ? "CRITICAL" : cappedScore >= 55 ? "HIGH" : cappedScore >= 28 ? "MEDIUM" : "LOW";

  return {
    score: cappedScore,
    level,
    label: {
      LOW: "منخفض",
      MEDIUM: "متوسط",
      HIGH: "مرتفع",
      CRITICAL: "حرج",
    }[level],
  };
}

export function buildMemberTimeline(input: {
  createdAt: Date;
  warnings: Array<{ id: string; reason: string; severity: string; createdAt: Date }>;
  summons: Array<{ id: string; reason: string; status: string; createdAt: Date }>;
  complaintsFiled: Array<{ id: string; reason: string; status: string; createdAt: Date; accused: { displayName: string } }>;
  complaintsAgainst: Array<{ id: string; reason: string; status: string; createdAt: Date; reporter: { displayName: string } }>;
  adminLogs: Array<{ id: string; title: string; action: string; createdAt: Date }>;
  rankChanges: Array<{ id: string; action: string; rank: string; createdAt: Date }>;
  leaveRequests: Array<{ id: string; reason: string; status: string; createdAt: Date }>;
}) {
  const events: TimelineEvent[] = [
    {
      id: "created",
      type: "JOINED",
      title: "تم تسجيل العضو في قاعدة TOKYO",
      meta: "بداية سجل العضو",
      createdAt: input.createdAt,
      tone: "green",
    },
    ...input.warnings.map((warning) => ({
      id: `warning-${warning.id}`,
      type: "WARNING",
      title: warning.reason,
      meta: warning.severity,
      createdAt: warning.createdAt,
      tone: warning.severity === "NORMAL" ? "yellow" as const : "red" as const,
    })),
    ...input.summons.map((summon) => ({
      id: `summon-${summon.id}`,
      type: "SUMMON",
      title: summon.reason,
      meta: summon.status,
      createdAt: summon.createdAt,
      tone: "cyan" as const,
    })),
    ...input.complaintsFiled.map((complaint) => ({
      id: `complaint-filed-${complaint.id}`,
      type: "COMPLAINT_FILED",
      title: complaint.reason,
      meta: `ضد ${complaint.accused.displayName} - ${complaint.status}`,
      createdAt: complaint.createdAt,
      tone: "gray" as const,
    })),
    ...input.complaintsAgainst.map((complaint) => ({
      id: `complaint-against-${complaint.id}`,
      type: "COMPLAINT_AGAINST",
      title: complaint.reason,
      meta: `من ${complaint.reporter.displayName} - ${complaint.status}`,
      createdAt: complaint.createdAt,
      tone: "red" as const,
    })),
    ...input.rankChanges.map((change) => ({
      id: `rank-${change.id}`,
      type: "RANK",
      title: `${change.action}: ${change.rank}`,
      meta: "تغيير رتبة",
      createdAt: change.createdAt,
      tone: "cyan" as const,
    })),
    ...input.leaveRequests.map((leave) => ({
      id: `leave-${leave.id}`,
      type: "LEAVE",
      title: leave.reason,
      meta: leave.status,
      createdAt: leave.createdAt,
      tone: "green" as const,
    })),
    ...input.adminLogs.map((log) => ({
      id: `log-${log.id}`,
      type: log.action,
      title: log.title,
      meta: "سجل إداري",
      createdAt: log.createdAt,
      tone: "gray" as const,
    })),
  ];

  return events.sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
}

export function buildMemberIntelligence(member: MemberRiskInput) {
  const risk = calculateMemberRisk(member);
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (member.warnings.some((warning) => warning.severity === "HIGH" || warning.severity === "DISMISSAL")) {
    issues.push("عنده تحذير قوي أو فصل مسجل");
    suggestions.push("يفضل استدعاء العضو ومراجعة سلوكه قبل أي ترقية");
  }

  if (member.complaintsAgainst.length > 0) {
    issues.push(`عليه ${member.complaintsAgainst.length} شكوى مفتوحة/حديثة`);
    suggestions.push("راجع الشكاوي قبل اتخاذ قرار إداري");
  }

  if (member.summons.length > 0) {
    issues.push(`عنده ${member.summons.length} استدعاء`);
  }

  if (member.behaviorScore < 60) {
    issues.push("تقييمه منخفض");
    suggestions.push("يفضل وضعه تحت المراقبة أو تنزيل التقييم بشكل رسمي");
  }

  if (issues.length === 0) {
    issues.push("ملفه مستقر حالياً");
    suggestions.push("مناسب للمتابعة الطبيعية أو الترشيح للتمييز إذا كان نشطاً");
  }

  return {
    summary: `العضو حالته ${risk.label}، ${issues.join("، ")}.`,
    suggestions,
    risk,
  };
}
