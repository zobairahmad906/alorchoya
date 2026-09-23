import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = (await requestLocale) || cookies().get("NEXT_LOCALE")?.value || "bn";
  const locale = requested === "en" ? "en" : "bn";
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
