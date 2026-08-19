# TOKYO GANG

الموقع الرسمي ولوحة الإدارة المركزية لـ TOKYO GANG. المشروع مبني باستخدام Next.js ويعمل على Cloudflare Workers عبر OpenNext.

## التشغيل محلياً

```bash
npm install
npm run dev
```

## إعدادات لوحة الإدارة

هذه إعدادات عادية وليست أسراراً، والقيم الفعلية موجودة في `wrangler.jsonc`:

| المتغير | وظيفته | القيمة الحالية |
| --- | --- | --- |
| `ADMIN_DASHBOARD_PAGE_SIZE` | عدد التقديمات في كل صفحة | `24` |
| `ADMIN_ACTIVITY_WINDOW_DAYS` | مدة التقرير الإداري | `7` أيام |
| `TOKYO_MEMBER_SYNC_INTERVAL_SECONDS` | الفاصل بين مزامنة أعضاء Discord | `60` ثانية |

مفاتيح Discord وقاعدة البيانات تبقى Cloudflare Secrets ولا يجب إضافتها إلى Git.

## الفحص والنشر

```bash
npm run lint
npm run build
npx opennextjs-cloudflare build
npx wrangler deploy
```

الموقع: [www.tokyo-gang.com](https://www.tokyo-gang.com)
