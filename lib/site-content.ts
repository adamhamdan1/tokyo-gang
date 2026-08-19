export type LeadershipMember = {
  id: string;
  name: string;
  role: string;
  code: string;
  visible: boolean;
};

export type StreamerProfile = {
  id: string;
  name: string;
  role: string;
  handle: string;
  kick: string;
  tiktok?: string;
  logo: string;
  verified: boolean;
  visible: boolean;
};

export type TimelineEntry = {
  id: string;
  title: string;
  description: string;
  visible: boolean;
};

export type WarArchiveEntry = {
  id: string;
  code: string;
  title: string;
  summary: string;
  outcome: string;
  year: string;
  type: string;
  status: "CLOSED" | "ACTIVE" | "CLASSIFIED";
  visible: boolean;
};

export type TokyoSiteContent = {
  leadership: LeadershipMember[];
  streamers: StreamerProfile[];
  timeline: TimelineEntry[];
  wars: WarArchiveEntry[];
};

export const DEFAULT_SITE_CONTENT: TokyoSiteContent = {
  leadership: [
    { id: "salvador", name: "سيلفادور كروز", role: "القائد الأعلى", code: "HC-01", visible: true },
    { id: "totti", name: "توتي كروز", role: "الزعيم", code: "HC-02", visible: true },
    { id: "hamdan", name: "حمدان كروز", role: "نائب القائد", code: "HC-03", visible: true },
    { id: "berlin-command", name: "برلين كروز", role: "نائب القائد", code: "HC-04", visible: true },
    { id: "santiago", name: "سنتياغو كروز", role: "العقل المدبر", code: "HC-05", visible: true },
  ],
  streamers: [
    {
      id: "pablo",
      name: "بابلو كروز",
      role: "Kick Partner",
      handle: "@pablo_jo",
      kick: "https://kick.com/pablo_jo",
      tiktok: "https://tiktok.com/@pablo",
      logo: "https://files.kick.com/images/user/48433338/profile_image/conversion/10176733-182a-48aa-9a6a-0b0834559265-fullsize.webp",
      verified: true,
      visible: true,
    },
    {
      id: "berlin",
      name: "برلين كروز",
      role: "Kick Partner",
      handle: "@berlin_br",
      kick: "https://kick.com/berlin_br",
      logo: "https://files.kick.com/images/user/38323508/profile_image/conversion/efd96238-b82f-43c1-a358-f838ef5b1df0-fullsize.webp",
      verified: true,
      visible: true,
    },
    {
      id: "adam",
      name: "آدم كروز",
      role: "Kick Partner",
      handle: "@adamx052",
      kick: "https://kick.com/adamx052",
      logo: "https://files.kick.com/images/user/97693230/profile_image/conversion/dc044615-712d-46e8-89ff-4caef746dbd5-fullsize.webp",
      verified: true,
      visible: true,
    },
    {
      id: "zoro",
      name: "زورو كروز",
      role: "Kick Partner",
      handle: "@zr_zoro1",
      kick: "https://kick.com/zr_zoro1",
      logo: "https://files.kick.com/images/user/51811338/profile_image/conversion/7ff27f0f-fb91-4c65-aba5-14b45847edb5-fullsize.webp",
      verified: true,
      visible: true,
    },
    {
      id: "selvadoor",
      name: "سيلفادور كروز",
      role: "ستريمر رسمي",
      handle: "@selvadoor1",
      kick: "https://kick.com/selvadoor1",
      logo: "https://files.kick.com/images/user/67102940/profile_image/conversion/cf78f425-3b8c-4acb-af48-660b839de87d-fullsize.webp",
      verified: false,
      visible: true,
    },
  ],
  timeline: [
    { id: "foundation", title: "مرحلة التأسيس", description: "بداية TOKYO GANG وبناء القيادة الأساسية.", visible: true },
    { id: "control", title: "أول سيطرة", description: "فرض الحضور داخل المدينة وإثبات الاسم.", visible: true },
    { id: "influence", title: "توسّع النفوذ", description: "تنظيم الأعضاء وتقوية الملفات الداخلية.", visible: true },
    { id: "system", title: "نظام الإدارة", description: "تحويل العصابة لمنظومة تقديمات ورتب ومتابعة.", visible: true },
  ],
  wars: [
    {
      id: "global-expansion",
      code: "OP-001",
      title: "التوسع العالمي",
      summary: "TOKYO GANG صار عالمياً، والقادم أعظم.",
      outcome: "تم تثبيت اسم TOKYO كقوة حاضرة داخل المدينة وخارجها.",
      year: "2026",
      type: "توسع ونفوذ",
      status: "CLOSED",
      visible: true,
    },
    {
      id: "first-betrayal",
      code: "OP-002",
      title: "ملف الخيانة الأول",
      summary: "إغلاق أول ملف خيانة داخل المنظومة.",
      outcome: "تمت حماية أسرار العصابة وإعادة ضبط الأمن الداخلي.",
      year: "2026",
      type: "أمن داخلي",
      status: "CLASSIFIED",
      visible: true,
    },
    {
      id: "infinity-control",
      code: "OP-003",
      title: "عملية إنفنتي",
      summary: "فرض السيطرة المباشرة بأراضي إنفنتي.",
      outcome: "اكتملت العملية وأُضيفت المنطقة لسجل نفوذ TOKYO.",
      year: "2026",
      type: "عملية ميدانية",
      status: "CLOSED",
      visible: true,
    },
  ],
};

function text(value: unknown, fallback: string, max = 220) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function boolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function url(value: unknown, fallback: string) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (candidate.startsWith("https://") || candidate.startsWith("/")) return candidate.slice(0, 700);
  return fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function list(value: unknown) {
  return Array.isArray(value) ? value.slice(0, 30) : [];
}

export function normalizeSiteContent(value: unknown): TokyoSiteContent {
  const input = record(value);

  const leadership = list(input.leadership).map((item, index) => {
    const source = record(item);
    const fallback = DEFAULT_SITE_CONTENT.leadership[index] ?? DEFAULT_SITE_CONTENT.leadership[0];
    return {
      id: text(source.id, `${fallback.id}-${index}`, 80),
      name: text(source.name, fallback.name, 80),
      role: text(source.role, fallback.role, 100),
      code: text(source.code, `HC-${String(index + 1).padStart(2, "0")}`, 20),
      visible: boolean(source.visible, true),
    };
  });

  const streamers = list(input.streamers).map((item, index) => {
    const source = record(item);
    const fallback = DEFAULT_SITE_CONTENT.streamers[index] ?? DEFAULT_SITE_CONTENT.streamers[0];
    return {
      id: text(source.id, `${fallback.id}-${index}`, 80),
      name: text(source.name, fallback.name, 80),
      role: text(source.role, fallback.role, 80),
      handle: text(source.handle, fallback.handle, 80),
      kick: url(source.kick, fallback.kick),
      tiktok: typeof source.tiktok === "string" && source.tiktok.trim() ? url(source.tiktok, "") : undefined,
      logo: url(source.logo, fallback.logo),
      verified: boolean(source.verified, fallback.verified),
      visible: boolean(source.visible, true),
    };
  });

  const timeline = list(input.timeline).map((item, index) => {
    const source = record(item);
    const fallback = DEFAULT_SITE_CONTENT.timeline[index] ?? DEFAULT_SITE_CONTENT.timeline[0];
    return {
      id: text(source.id, `${fallback.id}-${index}`, 80),
      title: text(source.title, fallback.title, 100),
      description: text(source.description, fallback.description, 300),
      visible: boolean(source.visible, true),
    };
  });

  const wars = list(input.wars).map((item, index) => {
    const source = record(item);
    const fallback = DEFAULT_SITE_CONTENT.wars[index] ?? DEFAULT_SITE_CONTENT.wars[0];
    const rawStatus = source.status;
    const status = rawStatus === "ACTIVE" || rawStatus === "CLASSIFIED" || rawStatus === "CLOSED" ? rawStatus : fallback.status;
    return {
      id: text(source.id, `${fallback.id}-${index}`, 80),
      code: text(source.code, `OP-${String(index + 1).padStart(3, "0")}`, 30),
      title: text(source.title, fallback.title, 120),
      summary: text(source.summary, fallback.summary, 280),
      outcome: text(source.outcome, fallback.outcome, 360),
      year: text(source.year, fallback.year, 12),
      type: text(source.type, fallback.type, 80),
      status,
      visible: boolean(source.visible, true),
    };
  });

  return {
    leadership: leadership.length ? leadership : DEFAULT_SITE_CONTENT.leadership,
    streamers: streamers.length ? streamers : DEFAULT_SITE_CONTENT.streamers,
    timeline: timeline.length ? timeline : DEFAULT_SITE_CONTENT.timeline,
    wars: wars.length ? wars : DEFAULT_SITE_CONTENT.wars,
  };
}

export function parseStoredSiteContent(value?: string | null) {
  if (!value) return DEFAULT_SITE_CONTENT;

  try {
    return normalizeSiteContent(JSON.parse(value));
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}
