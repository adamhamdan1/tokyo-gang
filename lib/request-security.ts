const TRUSTED_PRODUCTION_ORIGINS = new Set([
  "https://www.tokyo-gang.com",
  "https://tokyo-gang.com",
]);

export function validateJsonWriteRequest(request: Request, maxBytes = 32_000) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) return "نوع الطلب غير مدعوم";

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return "حجم البيانات أكبر من المسموح";

  const origin = request.headers.get("origin");
  if (!origin) return null;

  const requestOrigin = new URL(request.url).origin;
  const localOrigin = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
  if (origin !== requestOrigin && !TRUSTED_PRODUCTION_ORIGINS.has(origin) && !localOrigin) {
    return "تم رفض الطلب لأنه صادر من موقع غير موثوق";
  }

  return null;
}

export function cleanBoundedText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  if (!clean || clean.length > max) return null;
  return clean;
}

export function cleanOptionalText(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length <= max ? clean : null;
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}
