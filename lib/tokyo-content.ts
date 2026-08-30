export const TOKYO_RULES = [
  "احترام البوس والكو بوس وجميع الرتب العليا إلزامي.",
  "يمنع مخالفة الأوامر أثناء الاجتماعات أو السيناريوهات.",
  "الالتزام بالتواجد والتفاعل داخل السيرفر بشكل دائم.",
  "يمنع إثارة المشاكل أو نشر الفتن داخل العصابة.",
  "يمنع تسريب معلومات العصابة أو الخطط لأي جهة خارجية.",
  "يمنع إدخال أي شخص لمقر العصابة بدون إذن.",
  "يمنع استخدام اسم العصابة لأمور شخصية.",
  "يمنع التخريب أو التصرف الفردي بدون موافقة.",
  "الالتزام الكامل بالرول بلاي وعدم العشوائية.",
  "يمنع قتل أعضاء العصابة أو الاعتداء عليهم بدون سبب قوي.",
  "يمنع سحب السلاح داخل المقر إلا للضرورة.",
  "يمنع إطلاق النار العشوائي أو التهور بدون سبب.",
  "يمنع السرقة أو النصب على أعضاء العصابة.",
  "احترام الرتب وعدم التقليل من أي عضو.",
  "يمنع التدخل بقرارات الإدارة أو الاعتراض بطريقة غير لائقة.",
  "أي غياب طويل يجب تقديم إجازة مسبقاً.",
  "يمنع استخدام الحسابات الوهمية داخل العصابة.",
  "يمنع التحالف أو التعاون مع جهات معادية بدون إذن.",
  "الالتزام بالحضور وقت التجمعات والحروب.",
  "يمنع الخروج من السيناريو بدون سبب.",
  "الحفاظ على سمعة العصابة والتصرف بشكل يليق فيها.",
  "يمنع طلب الرتب أو الإلحاح على الإدارة.",
  "يمنع نشر محتوى يسيء للعصابة أو أعضائها.",
  "أي عضو تقييمه منخفض أو قليل التفاعل يعرض نفسه للفصل.",
  "مخالفة القوانين تعرضك للتحذير أو تنزيل تقييمك أو الطرد النهائي.",
];

export const TOKYO_ROLE_CATEGORIES = [
  {
    title: "الرتب الإدارية",
    roles: [
      {
        key: "OWNER_LEADER",
        discordName: "Owner-Leader ش",
        label: "القائد",
        description: "قائد العصابة والمسؤول الأول عن السيرفر، كلمته هي الفصل وقراراته نهائية.",
      },
      {
        key: "CO_LEADER",
        discordName: "Co Leader ش",
        label: "نائب القائد",
        description: "الأيد اليمنى للقائد، يدير السيرفر بغياب القائد وله نفس الصلاحيات تقريباً.",
      },
      {
        key: "DEVELOPER",
        discordName: "Developer ش",
        label: "المطور",
        description: "مسؤول عن تطوير السيرفر وإدارته التقنية من بوتات وقنوات وإعدادات.",
      },
      {
        key: "MANAGER",
        discordName: "Manager ش",
        label: "المدير",
        description: "يدير شؤون الأعضاء ويحافظ على النظام داخل السيرفر.",
      },
      {
        key: "STAFF",
        discordName: "Staff ش",
        label: "الإدارة",
        description: "فريق الدعم الإداري، يساعدون في تطبيق القوانين والإشراف على الأعضاء.",
      },
    ],
  },
  {
    title: "رتب العصابة",
    roles: [
      {
        key: "TOKYO_GANG",
        discordName: "Tokyo Gang ش",
        label: "عضو العصابة",
        description: "العضو الرسمي في العصابة، أثبت انتماءه وحصل على قبوله.",
      },
      {
        key: "ELITE_GANG",
        discordName: "Elite Gang ش",
        label: "النخبة",
        description: "أفضل أعضاء العصابة، تميزوا بنشاطهم وولائهم.",
      },
      {
        key: "WARRIOR",
        discordName: "Warrior ش",
        label: "المحارب",
        description: "عضو متمرس أثبت قدرته في الميدان ويحمل لقب المحارب بجدارة.",
      },
      {
        key: "SOLDIER",
        discordName: "Soldier ش",
        label: "الجندي",
        description: "عضو منتظم يؤدي واجبه ويلتزم بأوامر القيادة.",
      },
      {
        key: "RECRUIT",
        discordName: "Recruit ش",
        label: "المجند الجديد",
        description: "العضو الجديد الذي انضم حديثاً وما زال في مرحلة الاختبار.",
      },
    ],
  },
  {
    title: "الرتب الخاصة",
    roles: [
      {
        key: "VIP",
        discordName: "VIP ★",
        label: "عضو مميز",
        description: "عضو حصل على مكانة خاصة تميزه عن باقي الأعضاء.",
      },
      {
        key: "PLAYER_OF_THE_WEEK",
        discordName: "Player Of The Week ش",
        label: "لاعب الأسبوع",
        description: "جائزة أسبوعية تمنح لأفضل لاعب خلال الأسبوع.",
      },
      {
        key: "FRIEND_GANG",
        discordName: "Friend Gang ش",
        label: "صديق العصابة",
        description: "شخص من خارج العصابة لكنه حليف موثوق ومقرب منا.",
      },
      {
        key: "STREAMER",
        discordName: "Streamer ش",
        label: "الستريمر",
        description: "عضو يبث مباشر ويمثل العصابة أمام الجمهور.",
      },
      {
        key: "CONTENT_CREATOR",
        discordName: "Content Creator ش",
        label: "صانع المحتوى",
        description: "عضو يصنع محتوى للعصابة على منصات التواصل.",
      },
    ],
  },
  {
    title: "رتب الحالة",
    roles: [
      {
        key: "WARNINGS_MANAGER",
        discordName: "Warnings Manager ش",
        label: "مسؤول التحذيرات",
        description: "مسؤول عن متابعة تحذيرات الأعضاء وتطبيق العقوبات عند الحاجة.",
      },
      {
        key: "RECRUITMENT_MANAGER",
        discordName: "Recruitment Manager ش",
        label: "مسؤول التوظيف",
        description: "مسؤول عن استقبال الطلبات وقبول الأعضاء الجدد في العصابة.",
      },
      {
        key: "STREAMER_MANAGER",
        discordName: "Streamer Manager ش",
        label: "مسؤول الستريمرز",
        description: "مسؤول عن مراجعة تقديمات الستريمرز والمقابلات والقبول في الفريق الإعلامي.",
      },
      {
        key: "ON_LEAVE",
        discordName: "On Leave ش",
        label: "بإجازة",
        description: "عضو مؤقتاً غير نشط بسبب ظروف خاصة وسيعود قريباً.",
      },
      {
        key: "UNDER_REVIEW",
        discordName: "Under Review ش",
        label: "تحت المراقبة",
        description: "عضو يخضع للمراقبة بسبب تصرفات مخالفة، ينتظر قرار الإدارة.",
      },
      {
        key: "SUSPENDED",
        discordName: "Suspended ش",
        label: "موقوف مؤقتا",
        description: "عضو تم إيقافه مؤقتاً بسبب مخالفة صريحة للقوانين.",
      },
    ],
  },
] as const;

export const TOKYO_ROLE_OPTIONS = TOKYO_ROLE_CATEGORIES.flatMap((category) =>
  category.roles.map((role) => ({
    ...role,
    category: category.title,
  }))
);

export function getTokyoRoleOption(key: string) {
  return TOKYO_ROLE_OPTIONS.find((role) => role.key === key);
}
