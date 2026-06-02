export type ApplicationQualityInput = {
  age: string;
  city?: string | null;
  experience: string;
  reason: string;
  dailyHours?: string | null;
  hasMic: boolean;
  acceptedRules?: boolean;
};

export function calculateApplicationQuality(application: ApplicationQualityInput) {
  let score = 0;
  const notes: string[] = [];
  const age = Number(application.age);

  if (Number.isFinite(age) && age >= 16) score += 15;
  else notes.push("العمر يحتاج مراجعة");

  if (application.city?.trim()) score += 10;
  else notes.push("المدينة غير واضحة");

  if (application.hasMic) score += 15;
  else notes.push("لا يوجد مايك");

  if (application.acceptedRules) score += 10;

  if (application.experience.trim().length >= 80) score += 20;
  else if (application.experience.trim().length >= 35) score += 10;
  else notes.push("الخبرة قصيرة");

  if (application.reason.trim().length >= 80) score += 20;
  else if (application.reason.trim().length >= 35) score += 10;
  else notes.push("سبب الانضمام قصير");

  if (application.dailyHours?.includes("3-5") || application.dailyHours?.includes("أكثر")) score += 10;

  const level = score >= 75 ? "STRONG" : score >= 45 ? "NORMAL" : "WEAK";

  return {
    score,
    level,
    label: level === "STRONG" ? "قوي" : level === "NORMAL" ? "متوسط" : "ضعيف",
    notes,
  };
}
