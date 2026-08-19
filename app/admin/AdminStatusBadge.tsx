type Props = {
  value: string;
  compact?: boolean;
};

const badgeStyles: Record<string, string> = {
  ACTIVE: "border-green-400/25 bg-green-400/10 text-green-300",
  WARNED: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
  HIGH_RISK: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  FINAL_WARNING: "border-red-500/30 bg-red-500/10 text-red-300",
  ON_LEAVE: "border-blue-400/25 bg-blue-400/10 text-blue-300",
  SUMMONED: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  DISMISSED: "border-red-600/30 bg-red-600/10 text-red-300",
  BLACKLISTED: "border-red-700/35 bg-red-700/10 text-red-300",
  PENDING: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
  ACCEPTED: "border-green-400/25 bg-green-400/10 text-green-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
  TRIAL: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  INTERVIEW: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
};

const badgeLabels: Record<string, string> = {
  ACTIVE: "نشط",
  WARNED: "عليه تحذير",
  HIGH_RISK: "خطورة مرتفعة",
  FINAL_WARNING: "تحذير نهائي",
  ON_LEAVE: "في إجازة",
  SUMMONED: "تحت الاستدعاء",
  DISMISSED: "مفصول",
  BLACKLISTED: "قائمة سوداء",
  PENDING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  TRIAL: "فترة تجربة",
  INTERVIEW: "مقابلة",
};

export function AdminStatusBadge({ value, compact = false }: Props) {
  return (
    <span className={`inline-flex w-fit rounded-full border font-black ${badgeStyles[value] ?? "border-white/10 bg-white/5 text-gray-300"} ${compact ? "px-3 py-1 text-[10px]" : "px-4 py-2 text-xs"}`}>
      {badgeLabels[value] ?? value}
    </span>
  );
}
