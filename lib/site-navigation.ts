export const PRIMARY_NAVIGATION = [
  { id: "home", label: "الرئيسية", href: "#home", code: "01" },
  { id: "command", label: "القيادة", href: "#command", code: "02" },
  { id: "operations", label: "العمليات", href: "#operations", code: "03" },
  { id: "streamers", label: "الستريمرز", href: "#streamers", code: "04" },
  { id: "rules", label: "القوانين", href: "#rules", code: "05" },
  { id: "wars", label: "الحروب", href: "#wars", code: "06" },
  { id: "apply", label: "التقديم", href: "#apply", code: "07" },
] as const;

export const MEMBER_NAVIGATION = [
  { label: "حالة طلبي", href: "/status", code: "FILE", tone: "green" },
  { label: "تقديم Streamer", href: "/streamer-apply", code: "MEDIA", tone: "emerald" },
  { label: "الشكاوي", href: "/complaints", code: "CASE", tone: "cyan" },
  { label: "الإجازات", href: "/leave", code: "LEAVE", tone: "emerald" },
  { label: "القوانين الداخلية", href: "/rules-internal", code: "LAW", tone: "yellow" },
  { label: "لوحة الإدارة", href: "/admin", code: "ADMIN", tone: "red" },
] as const;
